import { NextResponse, type NextRequest } from 'next/server';

/**
 * Server-side route guard, in addition to the client-side <Protected> check: redirects
 * unauthenticated visitors before the page ever renders. It only checks whether an access-token
 * cookie is present (it's httpOnly, so its contents can't be read here) - the API still verifies
 * and authorizes every request itself, so this is a UX shortcut, not the security boundary.
 */
const PROTECTED_PREFIXES = ['/notes', '/admin', '/posts'];

export function proxy(req: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();
  if (!req.cookies.get('access_token')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/notes/:path*', '/admin/:path*', '/posts/:path*'] };
