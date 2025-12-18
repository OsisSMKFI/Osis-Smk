/**
 * Default OG Image Route - WhatsApp Compatible
 * 
 * CRITICAL FOR WHATSAPP:
 * ✅ Binary image response
 * ✅ Status 200 OK
 * ✅ Content-Type: image/*
 * ✅ Use facebookexternalhit User-Agent
 */

import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export const runtime = 'nodejs'

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo.png`
  : 'https://osissmktest.biezz.my.id/images/logo.png'

export async function GET() {
  try {
    // Try to read directly from filesystem first (faster, more reliable)
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
    
    if (fs.existsSync(logoPath)) {
      const imageBuffer = fs.readFileSync(logoPath)
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    // Fallback to HTTP fetch
    const res = await fetch(FALLBACK_URL, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1',
        'Accept': 'image/png, image/jpeg, image/*',
      },
    })

    if (!res.ok) {
      // Return 1x1 transparent PNG as last resort
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )
      return new NextResponse(transparentPng, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=60',
        },
      })
    }

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/png',
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
    return new NextResponse(transparentPng, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
      },
    })
  }
}
