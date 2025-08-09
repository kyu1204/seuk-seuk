import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rate limiting configuration
interface RateLimit {
  windowMs: number
  maxRequests: number
}

const RATE_LIMITS: Record<string, RateLimit> = {
  '/api/': { windowMs: 60000, maxRequests: 100 }, // General API: 100 requests per minute
  '/sign/': { windowMs: 60000, maxRequests: 30 }, // Signing: 30 requests per minute
  '/api/auth': { windowMs: 900000, maxRequests: 5 }, // Auth: 5 requests per 15 minutes
  '/api/share': { windowMs: 300000, maxRequests: 10 }, // Sharing: 10 requests per 5 minutes
}

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting function
function checkRateLimit(req: NextRequest, limit: RateLimit): boolean {
  const clientIP = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous'
  const key = `${clientIP}:${req.nextUrl.pathname}`
  const now = Date.now()

  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.windowMs
    })
    return true
  }

  if (current.count >= limit.maxRequests) {
    return false
  }

  current.count++
  rateLimitStore.set(key, current)
  return true
}

// Security headers function
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js needs unsafe-inline for development
    "style-src 'self' 'unsafe-inline'", // Tailwind needs unsafe-inline
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  
  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  return response
}

// Path matching helpers
function matchesPath(pathname: string, pattern: string): boolean {
  if (pattern.endsWith('/')) {
    return pathname.startsWith(pattern)
  }
  return pathname === pattern || pathname.startsWith(pattern + '/')
}

function getRateLimitForPath(pathname: string): RateLimit | null {
  for (const [pattern, limit] of Object.entries(RATE_LIMITS)) {
    if (matchesPath(pathname, pattern)) {
      return limit
    }
  }
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  // Rate limiting check
  const rateLimit_config = getRateLimitForPath(pathname)
  if (rateLimit_config && !checkRateLimit(request, rateLimit_config)) {
    console.warn(`Rate limit exceeded for ${request.ip} on ${pathname}`)
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60',
        'Content-Type': 'text/plain'
      }
    })
  }

  // API security checks
  if (pathname.startsWith('/api/')) {
    const contentType = request.headers.get('content-type')
    
    // Block suspicious content types for POST requests
    if (request.method === 'POST' && contentType) {
      const suspiciousTypes = ['text/html', 'text/xml', 'application/xml']
      if (suspiciousTypes.some(type => contentType.includes(type))) {
        console.warn(`Suspicious content type blocked: ${contentType} from ${request.ip}`)
        return new NextResponse('Bad Request', { status: 400 })
      }
    }

    // Size limit for uploads (10MB)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      console.warn(`Request too large: ${contentLength} bytes from ${request.ip}`)
      return new NextResponse('Payload Too Large', { status: 413 })
    }
  }
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
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

// Define protected routes
  const protectedRoutes = ['/dashboard']
  const authRoutes = ['/login', '/register']
  const publicRoutes = ['/sign'] // Share links are public

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if the current path is a public share route
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )

  // If user is not authenticated and trying to access protected route
  if (isProtectedRoute && !user) {
const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthRoute && user) {
return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Handle auth callback
  if (pathname === '/auth/callback') {
    const { searchParams } = new URL(request.url)
    const redirectTo = searchParams.get('redirect') || '/dashboard'
    
    if (user) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
  }

  // Add security headers and rate limit headers
  supabaseResponse = addSecurityHeaders(supabaseResponse)

  // Add rate limit headers
  if (rateLimit_config) {
    const clientIP = request.ip || 'anonymous'
    const key = `${clientIP}:${pathname}`
    const current = rateLimitStore.get(key)
    
    if (current) {
      supabaseResponse.headers.set('X-RateLimit-Limit', rateLimit_config.maxRequests.toString())
      supabaseResponse.headers.set('X-RateLimit-Remaining', Math.max(0, rateLimit_config.maxRequests - current.count).toString())
      supabaseResponse.headers.set('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString())
    }
  }

  // Security logging for sensitive operations
  if (pathname.includes('/share/') || pathname.includes('/sign/') || pathname.startsWith('/api/')) {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || 'none'
    
    console.log(`Security log: ${request.method} ${pathname} | IP: ${request.ip} | UA: ${userAgent.slice(0, 100)} | Ref: ${referer}`)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// Cleanup function for rate limit store (memory management)
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000) // Cleanup every minute
}