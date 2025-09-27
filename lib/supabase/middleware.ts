import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

interface Routes {
  [key: string]: boolean;
}
const publicRoutes: Routes = {
  "/login": true,
  "/register": true,
  "/auth": true,
  "/error": true,
  "/": true,
};

// Routes that should redirect to dashboard if user is authenticated
const publicOnlyRoutes: Routes = {
  "/login": true,
  "/register": true,
  "/": true,
};

// Function to check if a path is public
function isPublicRoute(pathname: string): boolean {
  // Check explicit public routes
  if (publicRoutes[pathname]) return true;

  // Check if it's a sign route (public for external users)
  if (pathname.startsWith("/sign/")) return true;

  return false;
}

// Protected routes that require authentication
const protectedRoutes: Routes = {
  "/upload": true,
  "/document": true,
  "/private": true,
  "/pricing": true,
};

// Function to check if a path is protected
function isProtectedRoute(pathname: string): boolean {
  // Check if the path starts with any protected route pattern
  return (
    Object.keys(protectedRoutes).some(
      (route) => pathname.startsWith(route) || pathname === route
    ) || pathname.startsWith("/document/")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is trying to access a protected route without authentication
  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    // no user, redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Check if authenticated user is trying to access public-only routes
  if (user && publicOnlyRoutes[request.nextUrl.pathname]) {
    // logged in user trying to access public-only page, redirect to dashboard
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
