import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isRegistrationEnabled } from '@/core/config/authConfig';

/**
 * Next.js middleware for route protection
 * Protects dashboard routes and redirects unauthenticated users to login
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies (set by login)
  const token = request.cookies.get('auth-token')?.value;
  
  // Check if registration is enabled
  const registrationEnabled = isRegistrationEnabled();
  
  // Public routes that don't require authentication
  const publicRoutes: string[] = ['/login'];
  if (registrationEnabled) {
    publicRoutes.push('/register');
  }
  
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // If trying to access /register when registration is disabled, redirect to login
  if (pathname.startsWith('/register') && !registrationEnabled) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If accessing a protected route without token, redirect to login
  if (!isPublicRoute && !token && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing login/register with token, redirect to dashboard
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

