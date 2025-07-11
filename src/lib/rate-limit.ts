import { NextRequest } from 'next/server'
import { cache } from './kv'

interface RateLimitOptions {
  windowMs: number
  max: number
  keyPrefix?: string
}

export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { windowMs, max, keyPrefix = 'rl' } = options
  
  // Get IP address
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const key = `${keyPrefix}:${ip}`
  
  // Get current count
  const count = await cache.incr(key)
  
  // Set expiry on first request
  if (count === 1) {
    await cache.expire(key, Math.floor(windowMs / 1000))
  }
  
  const remaining = Math.max(0, max - count)
  const reset = Date.now() + windowMs
  
  return {
    success: count <= max,
    remaining,
    reset,
  }
}

// Middleware helper
export function createRateLimiter(options: RateLimitOptions) {
  return async (request: NextRequest) => {
    const result = await rateLimit(request, options)
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          remaining: result.remaining,
          reset: new Date(result.reset).toISOString(),
        }),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': options.max.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    return null
  }
}