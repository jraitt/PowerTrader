import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/shop(.*)',
  '/about',
  '/contact',
  '/api/health',
  '/api/placeholder(.*)',
  '/api/proxy/image(.*)',
  '/api/public(.*)', // Allow public API access
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// Define admin-only routes that require admin role
const isAdminRoute = createRouteMatcher([
  '/inventory(.*)',
  '/api/items(.*)',
  '/api/upload(.*)',
  '/api/ai(.*)',
  '/api/admin(.*)',
]);

// Define routes that require authentication but not admin
const isAuthRoute = createRouteMatcher([
  '/api/auth/sync-user(.*)',
]);

export default clerkMiddleware((auth, request) => {
  const { userId } = auth();
  const { pathname } = request.nextUrl;

  // No auto-redirect to inventory - let users stay on homepage
  // Remove the auto-redirect behavior for authenticated users

  // Protect admin routes - require admin role
  if (isAdminRoute(request)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    
    // Check if user has admin role (we'll implement this check via metadata)
    // For now, we'll allow any authenticated user to access admin routes
    // This will be properly implemented with role checking
    return NextResponse.next();
  }

  // Protect auth routes that require authentication
  if (isAuthRoute(request) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Allow access to public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // For any other route, allow access (default to public)
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};