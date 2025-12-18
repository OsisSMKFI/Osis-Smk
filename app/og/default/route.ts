/**
 * Default OG Image Route - WhatsApp Compatible
 * 
 * CRITICAL FOR WHATSAPP:
 * ✅ Binary image response
 * ✅ Status 200 OK
 * ✅ Content-Type: image/jpeg
 * ✅ Use facebookexternalhit User-Agent
 * ✅ COMPRESSED to < 300KB for WhatsApp preview
 */

import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'

export const runtime = 'nodejs'

// WhatsApp OG Image requirements
const OG_WIDTH = 1200
const OG_HEIGHT = 630

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo-2.png`
  : 'https://osissmktest.biezz.my.id/images/logo-2.png'

export async function GET() {
  try {
    // Try to read directly from filesystem first (faster, more reliable)
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-2.png')
    
    let imageBuffer: Buffer
    
    if (fs.existsSync(logoPath)) {
      imageBuffer = fs.readFileSync(logoPath)
    } else {
      // Fallback to HTTP fetch
      const res = await fetch(FALLBACK_URL, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1',
          'Accept': 'image/png, image/jpeg, image/*',
        },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch logo')
      }
      imageBuffer = Buffer.from(await res.arrayBuffer())
    }

    // Compress with Sharp for WhatsApp
    const compressed = await sharp(imageBuffer)
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'contain',
        background: '#ffffff',
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()

    return new NextResponse(new Uint8Array(compressed), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': compressed.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[OG/default] Error:', error)
    
    // Return 1x1 transparent PNG
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
