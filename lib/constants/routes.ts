/**
 * Route configuration constants
 * Used for middleware authentication and sitemap generation
 */

interface Routes {
  [key: string]: boolean;
}

/**
 * Public routes accessible without authentication
 */
export const publicRoutes: Routes = {
  "/login": true,
  "/register": true,
  "/register/success": true,
  "/auth": true,
  "/error": true,
  "/": true,
  "/forgot-password": true,
  "/reset-password": true,
  "/privacy": true,
  "/term": true,
  "/contact": true,
};

/**
 * Routes that should redirect to dashboard if user is authenticated
 */
export const publicOnlyRoutes: Routes = {
  "/login": true,
  "/register": true,
  "/register/success": true,
  "/": true,
};

/**
 * Protected routes that require authentication
 */
export const protectedRoutes: Routes = {
  "/upload": true,
  "/document": true,
  "/pricing": true,
};

/**
 * Static public routes for sitemap generation
 * Excludes dynamic routes and auth callback routes
 */
export const sitemapRoutes = [
  "/",
  "/login",
  "/register",
  "/privacy",
  "/term",
  "/contact",
  "/forgot-password",
] as const;

/**
 * Check if a path is a public route
 */
export function isPublicRoute(pathname: string): boolean {
  // Check explicit public routes
  if (publicRoutes[pathname]) return true;

  // Check if it's a sign route (public for external users)
  if (pathname.startsWith("/sign/")) return true;

  // Check if it's an auth route (including auth/confirm, auth/callback, etc.)
  if (pathname.startsWith("/auth/")) return true;

  return false;
}

/**
 * Check if a path is a protected route
 */
export function isProtectedRoute(pathname: string): boolean {
  // Check if the path starts with any protected route pattern
  return (
    Object.keys(protectedRoutes).some(
      (route) => pathname.startsWith(route) || pathname === route
    ) || pathname.startsWith("/document/")
  );
}
