import type { NextRequest } from 'next/server';

/** Build a same-app base URL from deployment config, never from a forwarded Host header in production. */
export function getTrustedAppBaseUrl(request: NextRequest) {
  const configured = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return new URL(configured).origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return request.nextUrl.origin;
}
