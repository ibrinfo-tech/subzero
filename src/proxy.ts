import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isRegistrationEnabled } from '@/core/config/authConfig';
import { isProtectedRoute } from '@/core/config/protectedRoutes';

/**
 * Next.js proxy for route protection
 * Protects routes based on module configuration and redirects unauthenticated users to login
 * 
 * NOTE: This runs in Edge Runtime, so we use a static protectedRoutes config file
 * instead of dynamically reading from moduleRegistry (which uses Node.js APIs)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies (set by login)
  const token = request.cookies.get('access-token')?.value;
  
  console.log('[Proxy] Route Access:', {
    pathname,
    hasToken: !!token,
    allCookies: request.cookies.getSetCookie().length > 0,
    cookieNames: Array.from(request.cookies.entries()).map(([key]) => key),
  });
  
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
  
  // Check if current path is protected (using Edge Runtime compatible config)
  const routeIsProtected = isProtectedRoute(pathname);
  
  // If accessing a protected route without token, redirect to login
  if (!isPublicRoute && !token && routeIsProtected) {
    console.log('[Proxy] Redirecting to login - no token for protected route:', pathname);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing login/register with token, redirect to dashboard
  if (isPublicRoute && token) {
    console.log('[Proxy] Redirecting to dashboard - already authenticated');
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

