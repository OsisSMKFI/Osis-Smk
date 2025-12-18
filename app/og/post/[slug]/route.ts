/**
 * OG Image Proxy for Posts - WhatsApp Compatible
 * 
 * CRITICAL FOR WHATSAPP:
 * ✅ Binary image response (NOT JSON, NOT JSX)
 * ✅ Status 200 OK
 * ✅ Content-Type: image/*
 * ✅ NO redirect
 * ✅ NO auth
 * ✅ Use facebookexternalhit User-Agent
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Fallback image - MUST be accessible without auth
const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo.png`
  : 'https://osissmktest.biezz.my.id/images/logo.png'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { slug } = await params

    // 1. Get post from database
    const { data } = await supabase
      .from('posts')
      .select('featured_image')
      .eq('slug', slug)
      .single()

    // 2. Determine source image
    let src = FALLBACK_URL

    if (data?.featured_image) {
      // Skip videos
      const isVideo = /\.(mp4|webm|ogg)$/i.test(data.featured_image)
      if (!isVideo) {
        src = data.featured_image
      }
    }

    // 3. Fetch image as binary with WhatsApp-compatible headers
    const res = await fetch(src, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1', // WhatsApp uses this
        'Accept': 'image/jpeg, image/png, image/webp, image/*',
      },
    })

    // 4. Validate response is actually an image
    const contentType = res.headers.get('content-type') || ''
    
    if (!res.ok || !contentType.startsWith('image')) {
      // Fallback to logo
      const fallbackRes = await fetch(FALLBACK_URL, {
        headers: { 'User-Agent': 'facebookexternalhit/1.1' },
      })
      
      return new NextResponse(fallbackRes.body, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    // 5. Return binary image directly
    // WhatsApp will receive pure image bytes, not JSON
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

  } catch (error) {
    console.error('[OG/post] Error:', error)

    // Emergency fallback - return a simple image
    try {
      const fallbackRes = await fetch(FALLBACK_URL)
      return new NextResponse(fallbackRes.body, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } catch {
      // Last resort - return 1x1 transparent PNG
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
}
