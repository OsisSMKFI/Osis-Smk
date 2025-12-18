/**
 * OG Image Proxy for Sekbid - WhatsApp Compatible
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
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const sekbidId = parseInt(id)

    // 1. Validate sekbid ID
    if (isNaN(sekbidId) || sekbidId < 1 || sekbidId > 6) {
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

    // 2. Get sekbid from database
    const { data } = await supabase
      .from('sekbid')
      .select('image')
      .eq('id', sekbidId)
      .single()

    // 3. Determine source image
    const src = data?.image || FALLBACK_URL

    // 4. Fetch image as binary with WhatsApp-compatible headers
    const res = await fetch(src, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1',
        'Accept': 'image/jpeg, image/png, image/webp, image/*',
      },
    })

    // 5. Validate response is actually an image
    const contentType = res.headers.get('content-type') || ''
    
    if (!res.ok || !contentType.startsWith('image')) {
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

    // 6. Return binary image directly
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

  } catch (error) {
    console.error('[OG/sekbid] Error:', error)

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
