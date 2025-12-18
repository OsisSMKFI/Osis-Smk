/**
 * Default OG Image Route
 * 
 * URL: /og/default
 * Output: Default logo image (for static pages)
 * 
 * This ensures all pages have a working OG image from our domain
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://osissmktest.biezz.my.id'
const DEFAULT_IMAGE = `${SITE_URL}/images/logo.png`

export async function GET() {
  try {
    // Serve the default logo
    const imageResponse = await fetch(DEFAULT_IMAGE, {
      headers: {
        'Accept': 'image/*',
      },
    })

    if (!imageResponse.ok) {
      return new NextResponse('Default image not found', { status: 404 })
    }

    return new NextResponse(imageResponse.body, {
      headers: {
        'Content-Type': imageResponse.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-OG-Source': 'default',
      },
    })
  } catch (error) {
    console.error('[OG/default] Error:', error)
    return new NextResponse('Image error', { status: 500 })
  }
}
