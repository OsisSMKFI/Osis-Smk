/**
 * OG Image Proxy for Sekbid - WhatsApp Compatible
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
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo-2.png`
  : 'https://osissmktest.biezz.my.id/images/logo-2.png'

// WhatsApp OG Image requirements
const OG_WIDTH = 1200
const OG_HEIGHT = 630
const MAX_SIZE_KB = 250

interface RouteParams {
  params: Promise<{ id: string }>
}

async function serveFallback() {
  try {
    const fallbackRes = await fetch(FALLBACK_URL, {
      headers: { 'User-Agent': 'facebookexternalhit/1.1' },
    })
    
    if (!fallbackRes.ok) throw new Error('Fallback fetch failed')
    
    const buffer = Buffer.from(await fallbackRes.arrayBuffer())
    
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
    const sekbidId = parseInt(id)

    // 1. Validate sekbid ID
    if (isNaN(sekbidId) || sekbidId < 1 || sekbidId > 6) {
      return serveFallback()
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
      return serveFallback()
    }

    // 6. Compress with Sharp for WhatsApp
    const originalBuffer = Buffer.from(await res.arrayBuffer())
    
    let quality = 80
    let compressedBuffer = await sharp(originalBuffer)
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()
    
    // Reduce quality if still too large
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

    // 7. Return compressed image
    return new NextResponse(new Uint8Array(compressedBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': compressedBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

  } catch (error) {
    console.error('[OG/sekbid] Error:', error)
    return serveFallback()
  }
}
