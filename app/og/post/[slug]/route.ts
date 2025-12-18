/**
 * OG Image Proxy for Posts - WhatsApp Compatible
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
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Fallback image - MUST be accessible without auth
const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo.png`
  : 'https://osissmktest.biezz.my.id/images/logo.png'

// WhatsApp OG Image requirements:
// - Max size: ~300KB (WhatsApp times out on large images)
// - Recommended dimensions: 1200x630
// - Format: JPEG (best compression)
const OG_WIDTH = 1200
const OG_HEIGHT = 630
const MAX_SIZE_KB = 250 // Target under 300KB

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
      return serveFallback()
    }

    // 5. Get image buffer and compress with Sharp
    const originalBuffer = Buffer.from(await res.arrayBuffer())
    
    // Resize and compress for WhatsApp
    // Target: 1200x630, JPEG quality adjusted to stay under 250KB
    let quality = 80
    let compressedBuffer = await sharp(originalBuffer)
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()
    
    // If still too large, reduce quality progressively
    while (compressedBuffer.length > MAX_SIZE_KB * 1024 && quality > 30) {
      quality -= 10
      compressedBuffer = await sharp(originalBuffer)
        .resize(OG_WIDTH, OG_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer()
    }

    // 6. Return compressed image
    return new NextResponse(new Uint8Array(compressedBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': compressedBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

  } catch (error) {
    console.error('[OG/post] Error:', error)
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
    
    // Compress fallback too
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
    // Last resort - return 1x1 transparent PNG
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
