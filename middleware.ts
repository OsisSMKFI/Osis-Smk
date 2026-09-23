import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

// Only run middleware on admin/dashboard routes (auth gate).
// x-pathname is no longer needed - root layout is static and BackgroundSync uses usePathname.
export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};

const applicationMiddleware = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

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
