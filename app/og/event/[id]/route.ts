/**
 * OG Image Proxy for Events - WhatsApp Compatible
 * 
 * CRITICAL FOR WHATSAPP:
 * ✅ Binary image response (NOT JSON, NOT JSX)
 * ✅ Status 200 OK
 * ✅ Content-Type: image/jpeg
 * ✅ NO redirect
 * ✅ NO auth
 * ✅ Use facebookexternalhit User-Agent
 * ✅ COMPRESSED to < 300KB for WhatsApp preview
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/server'
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

export const runtime = 'nodejs'

// Fallback image - MUST be accessible without auth
const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo-2.png`
  : 'https://osissmktest.biezz.my.id/images/logo-2.png'

// WhatsApp OG Image requirements:
const OG_WIDTH = 1200
const OG_HEIGHT = 630
const MAX_SIZE_KB = 250

interface RouteParams {
  params: Promise<{ id: string }>
}

async function serveFallback(): Promise<NextResponse> {
  try {
    // Try filesystem first
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-2.png')
    
    let imageBuffer: Buffer
    
    if (fs.existsSync(logoPath)) {
      imageBuffer = fs.readFileSync(logoPath)
    } else {
      const res = await fetch(FALLBACK_URL, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1',
          'Accept': 'image/png, image/jpeg, image/*',
        },
      })
      if (!res.ok) throw new Error('Failed to fetch fallback')
      imageBuffer = Buffer.from(await res.arrayBuffer())
    }

    // Resize for OG
    const compressedBuffer = await sharp(imageBuffer)
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()

    return new NextResponse(new Uint8Array(compressedBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': compressedBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    // Return 1x1 transparent PNG as last resort
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

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    // 1. Get event from database
    const { data } = await supabase
      .from('events')
      .select('image_url, title')
      .eq('id', id)
      .single()

    // 2. Determine source image
    let src = ''

    if (data?.image_url) {
      // Skip videos
      const isVideo = /\.(mp4|webm|ogg)$/i.test(data.image_url)
      if (!isVideo) {
        src = data.image_url
      }
    }

    // If no image, return fallback
    if (!src) {
      return serveFallback()
    }

    // 3. Fetch image as binary with WhatsApp-compatible headers
    const res = await fetch(src, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1',
        'Accept': 'image/jpeg, image/png, image/webp, image/*',
      },
    })

    // 4. Validate response is actually an image
    const contentType = res.headers.get('content-type') || ''
    
    if (!res.ok || !contentType.startsWith('image')) {
      return serveFallback()
    }

    // 5. Get image buffer and compress with Sharp
    const originalBuffer = Buffer.from(await res.arrayBuffer())
    
    let quality = 80
    let compressedBuffer = await sharp(originalBuffer)
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()
    
    // If still too large, reduce quality progressively
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

    // 6. Return as binary image
    return new NextResponse(new Uint8Array(compressedBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': compressedBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400',
        'X-OG-Source': 'event',
        'X-OG-Event-Id': id,
      },
    })
  } catch (error) {
    console.error('[OG/event] Error:', error)
    return serveFallback()
  }
}
