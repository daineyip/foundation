import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  
  // Define public paths that don't require authentication
  const isPublicPath = 
    nextUrl.pathname === '/login' || 
    nextUrl.pathname === '/' || 
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.includes('/_next') ||
    nextUrl.pathname.includes('/images') ||
    nextUrl.pathname.includes('/fonts');

  // Get the token using next-auth
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Redirect logic for authenticated users trying to access public routes
  if (isPublicPath && token) {
    // If already logged in and trying to access login page, redirect to dashboard
    if (nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Redirect logic for unauthenticated users trying to access protected routes
  if (!isPublicPath && !token) {
    // If not logged in and trying to access a protected route, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 