import { NextResponse } from "next/server";

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

const trackerMap = new Map<string, RateLimitTracker>();

// Clean up expired IP records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of trackerMap.entries()) {
    if (now > data.resetTime) {
      trackerMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  limit?: number;        // Max allowed requests in window
  windowMs?: number;     // Window duration in ms
  identifier?: string;   // Unique key (e.g. IP address or userId)
}

/**
 * Basic in-memory rate limiter helper for Next.js API Routes.
 */
export function rateLimit(
  req: Request,
  options: RateLimitOptions = {}
): { isRateLimited: boolean; remaining: number; errorResponse?: NextResponse } {
  const limit = options.limit || 60; // 60 requests
  const windowMs = options.windowMs || 60 * 1000; // per 1 minute

  // Determine IP / identifier
  const ip =
    options.identifier ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "global_anonymous_ip";

  const now = Date.now();
  const record = trackerMap.get(ip);

  if (!record || now > record.resetTime) {
    trackerMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { isRateLimited: false, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return {
      isRateLimited: true,
      remaining: 0,
      errorResponse: NextResponse.json(
        { error: "Too many requests. Please try again later.", retryAfterSeconds: retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      ),
    };
  }

  record.count += 1;
  return {
    isRateLimited: false,
    remaining: limit - record.count,
  };
}
