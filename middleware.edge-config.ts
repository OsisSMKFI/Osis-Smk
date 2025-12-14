/**
 * Vercel Edge Config Middleware
 * Intercepts requests for feature flags, redirects, and IP blocking
 * 
 * Add this to your existing middleware or use as standalone
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { get } from '@vercel/edge-config';

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  try {
    // ==========================================
    // 1. Maintenance Mode Check
    // ==========================================
    const maintenanceMode = await get<boolean>('maintenanceMode');
    if (maintenanceMode && !pathname.startsWith('/maintenance') && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    // ==========================================
    // 2. IP Blocking
    // ==========================================
    const blockedIPs = await get<string[]>('blockedIPs');
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
                    || request.headers.get('x-real-ip') 
                    || 'unknown';
    
    if (blockedIPs?.includes(clientIP)) {
      return new NextResponse('Access Denied', { status: 403 });
    }

    // ==========================================
    // 3. Dynamic Redirects
    // ==========================================
    const redirects = await get<Array<{
      source: string;
      destination: string;
      permanent?: boolean;
    }>>('redirects');
    
    if (redirects) {
      const redirect = redirects.find(r => r.source === pathname);
      if (redirect) {
        return NextResponse.redirect(
          new URL(redirect.destination, request.url),
          redirect.permanent ? 308 : 307
        );
      }
    }

    // ==========================================
    // 4. Feature Flags (add to headers for use in pages)
    // ==========================================
    const featureFlags = await get<Record<string, boolean>>('featureFlags');
    const response = NextResponse.next();
    
    if (featureFlags) {
      response.headers.set('x-feature-flags', JSON.stringify(featureFlags));
    }

    // Add pathname header for layout
    response.headers.set('x-pathname', pathname);

    return response;
  } catch (error) {
    // If Edge Config fails, continue without it
    console.error('[Edge Config Middleware] Error:', error);
    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
  }
}
