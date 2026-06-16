import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// ---------------------------------------------------------------------------
// Redis-backed limiter (active when UPSTASH_REDIS_REST_URL is set).
// Falls back to in-memory map when the env vars are absent (dev / CI).
// ---------------------------------------------------------------------------

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

function makeRedisLimiter(limit: number, window: `${number} s` | `${number} m`) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: false,
  })
}

// Cache limiters by key so we don't recreate them on every request
const redisLimiters = new Map<string, Ratelimit>()

function getRedisLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null
  const key = `${limit}:${windowMs}`
  if (!redisLimiters.has(key)) {
    // Convert ms to Upstash sliding-window string
    const seconds = Math.round(windowMs / 1000)
    const limiter = makeRedisLimiter(limit, `${seconds} s`)
    if (limiter) redisLimiters.set(key, limiter)
  }
  return redisLimiters.get(key) ?? null
}

// ---------------------------------------------------------------------------
// In-memory fallback (single-process only — not suitable for serverless)
// ---------------------------------------------------------------------------

const fallbackMap = new Map<string, number[]>()

function checkInMemory(
  ip: string,
  limit: number,
  windowMs: number,
): { success: boolean; remaining: number } {
  const now = Date.now()
  const windowStart = now - windowMs
  let timestamps = (fallbackMap.get(ip) ?? []).filter((t) => t > windowStart)

  if (timestamps.length >= limit) {
    return { success: false, remaining: 0 }
  }

  timestamps.push(now)
  fallbackMap.set(ip, timestamps)

  if (fallbackMap.size > 10_000) fallbackMap.clear()

  return { success: true, remaining: limit - timestamps.length }
}

// ---------------------------------------------------------------------------
// Public API — matches the existing signature so call-sites are unchanged
// ---------------------------------------------------------------------------

export interface RateLimitOptions {
  limit: number
  windowMs: number
}

const DEFAULT_OPTIONS: RateLimitOptions = { limit: 60, windowMs: 60_000 }

export async function checkRateLimit(
  ip: string,
  options: RateLimitOptions = DEFAULT_OPTIONS,
): Promise<{ success: boolean; limit: number; remaining: number }> {
  const { limit, windowMs } = options

  const redisLimiter = getRedisLimiter(limit, windowMs)
  if (redisLimiter) {
    const result = await redisLimiter.limit(ip)
    return { success: result.success, limit, remaining: result.remaining }
  }

  // In-memory fallback
  const result = checkInMemory(ip, limit, windowMs)
  return { success: result.success, limit, remaining: result.remaining }
}

export function getIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0].trim()
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "127.0.0.1"
}
