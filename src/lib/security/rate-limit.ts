// In-memory rate limiting map
const rateLimitMap = new Map<string, number[]>()

export interface RateLimitOptions {
  limit: number
  windowMs: number
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  limit: 60, // 60 requests
  windowMs: 60 * 1000, // per 1 minute
}

export function checkRateLimit(ip: string, options: RateLimitOptions = DEFAULT_OPTIONS): { success: boolean; limit: number; remaining: number } {
  const now = Date.now()
  const windowStart = now - options.windowMs

  let requestTimestamps = rateLimitMap.get(ip) || []
  
  // Clean up old timestamps
  requestTimestamps = requestTimestamps.filter((timestamp) => timestamp > windowStart)

  const currentRequests = requestTimestamps.length

  if (currentRequests >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
    }
  }

  requestTimestamps.push(now)
  rateLimitMap.set(ip, requestTimestamps)

  // Opcional: limpiar IPs viejas para evitar fugas de memoria (simple garbage collection periódico)
  if (rateLimitMap.size > 10000) {
    rateLimitMap.clear()
  }

  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - requestTimestamps.length,
  }
}

export function getIp(req: Request): string {
  // Extract IP from headers
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  const realIp = req.headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }
  return "127.0.0.1" // Fallback
}
