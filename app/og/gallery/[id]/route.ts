/**
 * OG Image Proxy for Gallery Items - WhatsApp Compatible
 *
 * Serves the gallery photo (image_url) compressed for WhatsApp preview.
 * Falls back to the OSIS logo when the item has no image
 * (e.g. a video without a poster frame).
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/server'
import { resolveStorageUrl } from '@/lib/mediaUrls'
import sharp from 'sharp'

export const runtime = 'nodejs'

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo-2.png`
  : 'https://osissmkfi.biezz.my.id/images/logo-2.png'

const OG_WIDTH = 1200
const OG_HEIGHT = 630
const MAX_SIZE_KB = 250

const VIDEO_RE = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    let src: string | null = null

    if (/^\d+$/.test(id)) {
      const { data } = await supabase
        .from('gallery')
        .select('image_url, video_url, url, category, folder')
        .eq('id', Number(id))
        .single()

      if (data) {
        const folder = (data as any).category || (data as any).folder || 'general'
        const image = resolveStorageUrl((data as any).image_url, folder)
        const video = resolveStorageUrl((data as any).video_url, folder)
        const url = resolveStorageUrl((data as any).url, folder)
        const candidate = image || url || video
        // Videos cannot be used as OG preview image - fall back to logo
        if (candidate && !VIDEO_RE.test(candidate)) {
          src = candidate
        }
      }
    }

    if (!src) {
      return serveFallback()
    }

    const res = await fetch(src, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1',
        'Accept': 'image/jpeg, image/png, image/webp, image/*',
      },
    })

    const contentType = res.headers.get('content-type') || ''
    if (!res.ok || !contentType.startsWith('image')) {
      return serveFallback()
    }

    const originalBuffer = Buffer.from(await res.arrayBuffer())

    let quality = 80
    let compressedBuffer = await sharp(originalBuffer)
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()

    while (compressedBuffer.length > MAX_SIZE_KB * 1024 && quality > 30) {
      quality -= 10
      compressedBuffer = await sharp(originalBuffer)
        .resize(OG_WIDTH, OG_HEIGHT, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer()
    }

    return new NextResponse(new Uint8Array(compressedBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': compressedBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[OG/gallery] Error:', error)
    return serveFallback()
  }
}

async function serveFallback() {
  try {
    const fallbackRes = await fetch(FALLBACK_URL, {
      headers: { 'User-Agent': 'facebookexternalhit/1.1' },
    })

    if (!fallbackRes.ok) throw new Error('Fallback fetch failed')

    const buffer = Buffer.from(await fallbackRes.arrayBuffer())

    const compressed = await sharp(buffer)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: 'contain', background: '#ffffff' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()

    return new NextResponse(new Uint8Array(compressed), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': compressed.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    const transparentPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    return new NextResponse(new Uint8Array(transparentPng), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
      },
    })
  }
}
