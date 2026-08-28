import { NextResponse } from 'next/server';
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');
  
  // Protect all routes except the root landing page (/) and the login page
  const isProtected = req.nextUrl.pathname !== '/' && !isAuthPage && !req.nextUrl.pathname.startsWith('/api/auth');

  let response = NextResponse.next();

  if (isProtected && !isLoggedIn) {
    // Redirect unauthenticated users to the login page
    response = NextResponse.redirect(new URL('/login', req.nextUrl));
  } else if (isAuthPage && isLoggedIn) {
    // Redirect authenticated users away from the login page
    response = NextResponse.redirect(new URL('/upload', req.nextUrl)); // Dashboard/Upload
  }

  // Add Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload/:path*',
    '/chat/:path*'
  ],
};
