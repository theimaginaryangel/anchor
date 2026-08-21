import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');
  
  // Protect all routes except the root landing page (/) and the login page
  const isProtected = req.nextUrl.pathname !== '/' && !isAuthPage && !req.nextUrl.pathname.startsWith('/api/auth');

  if (isProtected && !isLoggedIn) {
    // Redirect unauthenticated users to the login page
    return Response.redirect(new URL('/login', req.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    // Redirect authenticated users away from the login page
    return Response.redirect(new URL('/upload', req.nextUrl)); // Dashboard/Upload
  }
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload/:path*',
    '/chat/:path*'
  ],
};
