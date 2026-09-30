import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

// Only run middleware on admin/dashboard routes (auth gate).
// x-pathname is no longer needed - root layout is static and BackgroundSync uses usePathname.
export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/api/admin/:path*'],
};

const ADMIN_PANEL_ROLES = ['super_admin', 'admin', 'osis'];

// Routes under /api/admin that stay public (they serve unauthenticated pages)
function isPublicAdminApi(request: NextRequest, pathname: string): boolean {
  if (pathname === '/api/admin/auto_runner') return true; // cron job, auth via x-admin-ops-token in route
  if (request.method !== 'GET') return false;
  if (pathname === '/api/admin/design/apply') return true; // theme loader on public pages
  if (pathname === '/api/admin/notifications/reply') return true; // LiveChat widget replies
  return false;
}

// GET /api/admin/users/* only needs a session (own-profile check lives in the route)
function isSessionOnlyAdminApi(request: NextRequest, pathname: string): boolean {
  return request.method === 'GET' && /^\/api\/admin\/users(\/|$)/.test(pathname);
}

const apiGateResponse = (message: string, status: number) =>
  NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Forbidden', message }, { status });

const applicationMiddleware = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  // Admin API gate (every /api/admin/* route)
  if (pathname.startsWith('/api/admin')) {
    if (isPublicAdminApi(request, pathname)) {
      return NextResponse.next();
    }

    const session = await auth();
    if (!session?.user) {
      return apiGateResponse('Login diperlukan', 401);
    }

    if (isSessionOnlyAdminApi(request, pathname)) {
      return NextResponse.next();
    }

    const userRole = (session.user.role || '').trim().toLowerCase();
    if (!ADMIN_PANEL_ROLES.includes(userRole)) {
      return apiGateResponse('Anda tidak memiliki akses ke panel admin', 403);
    }

    return NextResponse.next();
  }

  // Public auth pages
  if (
    pathname === '/admin/login' ||
    pathname === '/admin/forgot-password' ||
    pathname.startsWith('/admin/reset-password') ||
    pathname === '/register' ||
    pathname.startsWith('/verify-email') ||
    pathname === '/waiting-approval' ||
    pathname === '/waiting-verification'
  ) {
    return NextResponse.next();
  }

  // Admin gate
  if (pathname.startsWith('/admin')) {
    const session = await auth();
    if (!session?.user) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    if (pathname === '/admin/profile') {
      return NextResponse.next();
    }

    const userRole = (session.user.role || '').trim().toLowerCase();

    const adminRoles = ['super_admin', 'admin', 'osis'];
    const isAdmin = adminRoles.includes(userRole);
    if (!isAdmin) {
      const url = new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // Dashboard gate
  if (pathname.startsWith('/dashboard')) {
    const session = await auth();
    if (!session?.user) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
};

export default applicationMiddleware;
