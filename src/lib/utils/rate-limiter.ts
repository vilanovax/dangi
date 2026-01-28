/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based solution like @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number
  resetTime: number
  blockedUntil?: number
}

// Store rate limit data per identifier (IP address)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
      rateLimitStore.delete(key)
    }
  }
}, 10 * 60 * 1000)

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the time window
   * @default 5
   */
  maxRequests?: number

  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number

  /**
   * Block duration in milliseconds after exceeding limit
   * @default 900000 (15 minutes)
   */
  blockDurationMs?: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  blockedUntil?: number
}

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param options - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const {
    maxRequests = 5,
    windowMs = 60 * 1000, // 1 minute
    blockDurationMs = 15 * 60 * 1000, // 15 minutes
  } = options

  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // Check if identifier is currently blocked
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blockedUntil: entry.blockedUntil,
    }
  }

  // No entry or window expired - create new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(identifier, newEntry)

    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: newEntry.resetTime,
    }
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  if (entry.count > maxRequests) {
    entry.blockedUntil = now + blockDurationMs
    rateLimitStore.set(identifier, entry)

    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blockedUntil: entry.blockedUntil,
    }
  }

  // Update entry
  rateLimitStore.set(identifier, entry)

  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Get client IP address from request headers
 * Checks common headers used by proxies and load balancers
 */
export function getClientIp(request: Request): string {
  // Check common headers in order of preference
  const headers = [
    'x-real-ip',
    'x-forwarded-for',
    'cf-connecting-ip', // Cloudflare
    'true-client-ip', // Cloudflare Enterprise
    'x-client-ip',
  ]

  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0].trim()
      if (ip) return ip
    }
  }

  // Fallback to 'unknown' if no IP found
  return 'unknown'
}
