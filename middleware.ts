import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    headers: request.headers,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value, options))
          supabaseResponse = NextResponse.next({
            headers: supabaseResponse.headers,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedRoutes = ['/upload', '/document', '/dashboard']

  // Auth routes that should redirect to upload if already authenticated
  const authRoutes = ['/login', '/register']

  const { pathname } = request.nextUrl

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  )

  // If user is not authenticated and trying to access protected route
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    const redirectResponse = NextResponse.redirect(redirectUrl)

    // Copy cookies from supabaseResponse to preserve session/refresh tokens
    const cookies = supabaseResponse.headers.get('set-cookie')
    if (cookies) {
      redirectResponse.headers.set('set-cookie', cookies)
    }

    return redirectResponse
  }

  // If user is authenticated and trying to access auth routes
  if (isAuthRoute && user) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    const redirectUrl = new URL(redirectTo || '/upload', request.url)
    const redirectResponse = NextResponse.redirect(redirectUrl)

    // Copy cookies from supabaseResponse to preserve session/refresh tokens
    const cookies = supabaseResponse.headers.get('set-cookie')
    if (cookies) {
      redirectResponse.headers.set('set-cookie', cookies)
    }

    return redirectResponse
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}