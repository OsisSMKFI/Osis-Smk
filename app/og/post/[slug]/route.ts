/**
 * OG Image Proxy for Posts
 * 
 * INDUSTRY STANDARD: Serve Supabase images through our domain
 * WhatsApp ONLY trusts images from the same domain as the OG tag
 * 
 * URL: /og/post/{slug}
 * Output: Image (proxied from Supabase or fallback)
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

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { slug } = await params

    // 1. Fetch post from database
    const { data: post, error } = await supabase
      .from('posts')
      .select('featured_image, title')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      console.error('[OG/post] DB error:', error.message)
    }

    // 2. Determine image URL (post image or fallback)
    let imageUrl = FALLBACK_IMAGE

    if (post?.featured_image) {
      // Check if it's a video (can't use as OG image)
      const isVideo = /\.(mp4|webm|ogg)$/i.test(post.featured_image)
      if (!isVideo) {
        imageUrl = post.featured_image
      }
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
          'Content-Type': fallbackResponse.headers.get('content-type') || 'image/png',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'X-OG-Source': 'fallback',
        },
      })
    }

    // 4. Serve the image from OUR DOMAIN
    // WhatsApp will see: osissmktest.biezz.my.id/og/post/xxx
    // NOT: supabase.co/xxx
    return new NextResponse(imageResponse.body, {
      headers: {
        'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-OG-Source': 'proxied',
        'X-OG-Original': imageUrl.substring(0, 100), // Debug info (truncated)
      },
    })
  } catch (error) {
    console.error('[OG/post] Error:', error)

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
