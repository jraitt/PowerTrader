import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/api/health',
  '/api/placeholder(.*)',
  '/api/proxy/image(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/inventory(.*)',
  '/api/items(.*)',
  '/api/upload(.*)',
  '/api/ai(.*)',
  '/api/auth/sync-user(.*)',
]);

export default clerkMiddleware((auth, request) => {
  const { userId } = auth();
  const { pathname } = request.nextUrl;

  // If user is authenticated and on public pages, redirect to inventory
  if (userId && (pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/inventory', request.url));
  }

  // Protect routes that require authentication
  if (isProtectedRoute(request) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Allow access to public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Protect all other routes by default
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};