import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role as string | undefined;

  // Protect dashboard and admin — redirect to home with modal trigger if not authenticated
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  if (isProtected && !isLoggedIn) {
    const url = new URL('/', req.url);
    url.searchParams.set('auth', '1');
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Role guard — non-admins can't access /admin
  if (pathname.startsWith('/admin') && isLoggedIn && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Role-based redirect — admins hitting /dashboard go to /admin instead
  if (pathname.startsWith('/dashboard') && isLoggedIn && role === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // Add security headers to every response
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
  );

  return response;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)'],
};
