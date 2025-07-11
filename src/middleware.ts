import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRateLimiter } from '@/lib/rate-limit'

// Rate limiters for different endpoints
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  keyPrefix: 'auth',
})

const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  keyPrefix: 'api',
})

export async function middleware(request: NextRequest) {
  // Apply rate limiting to auth endpoints
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    const rateLimitResponse = await authRateLimiter(request)
    if (rateLimitResponse) return rateLimitResponse
  }
  
  // Apply general rate limiting to other API endpoints
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResponse = await apiRateLimiter(request)
    if (rateLimitResponse) return rateLimitResponse
  }
  
  // Add security headers
  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}