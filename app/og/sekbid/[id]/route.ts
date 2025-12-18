/**
 * OG Image Proxy for Sekbid
 * 
 * INDUSTRY STANDARD: Serve Supabase images through our domain
 * WhatsApp ONLY trusts images from the same domain as the OG tag
 * 
 * URL: /og/sekbid/{id}
 * Output: Image (proxied from Supabase or generated fallback)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://osissmktest.biezz.my.id'
const FALLBACK_IMAGE = `${SITE_URL}/images/logo.png`

// Sekbid names for fallback
const SEKBID_NAMES: Record<number, string> = {
  1: 'Keagamaan',
  2: 'Kaderisasi',
  3: 'Akademik',
  4: 'Olahraga & Kewirausahaan',
  5: 'Kesehatan & Lingkungan',
  6: 'Publikasi & Dokumentasi',
}

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

    if (isNaN(sekbidId) || sekbidId < 1 || sekbidId > 6) {
      // Invalid sekbid, return fallback
      const fallbackResponse = await fetch(FALLBACK_IMAGE)
      return new NextResponse(fallbackResponse.body, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
          'X-OG-Source': 'invalid-id-fallback',
        },
      })
    }

    // 1. Try to fetch sekbid image from database
    const { data: sekbid, error } = await supabase
      .from('sekbid')
      .select('image, name')
      .eq('id', sekbidId)
      .single()

    if (error) {
      console.error('[OG/sekbid] DB error:', error.message)
    }

    // 2. Determine image URL
    let imageUrl = FALLBACK_IMAGE

    if (sekbid?.image) {
      imageUrl = sekbid.image
    }

    // 3. Fetch the actual image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*',
      },
    })

    if (!imageResponse.ok) {
      // Fallback if image fetch fails
      const fallbackResponse = await fetch(FALLBACK_IMAGE)
      return new NextResponse(fallbackResponse.body, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'X-OG-Source': 'fetch-failed-fallback',
        },
      })
    }

    // 4. Serve the image from OUR DOMAIN
    return new NextResponse(imageResponse.body, {
      headers: {
        'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-OG-Source': 'proxied',
        'X-OG-Sekbid': SEKBID_NAMES[sekbidId] || `Sekbid ${sekbidId}`,
      },
    })
  } catch (error) {
    console.error('[OG/sekbid] Error:', error)

    // Return fallback on any error
    try {
      const fallbackResponse = await fetch(FALLBACK_IMAGE)
      return new NextResponse(fallbackResponse.body, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
          'X-OG-Source': 'error-fallback',
        },
      })
    } catch {
      return new NextResponse('Image not found', { status: 404 })
    }
  }
}
