/**
 * OG Image Proxy for Announcements - WhatsApp Compatible
 * 
 * Falls back to default logo since announcements typically don't have images
 */

import { NextResponse } from 'next/server'
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

export const runtime = 'nodejs'

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo-2.png`
  : 'https://osissmktest.biezz.my.id/images/logo-2.png'

const OG_WIDTH = 1200
const OG_HEIGHT = 630

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    // Announcements typically don't have images, serve logo
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
        'X-OG-Source': 'announcement',
        'X-OG-Announcement-Id': id,
      },
    })
  } catch (error) {
    console.error('[OG/announcement] Error:', error)
    
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
