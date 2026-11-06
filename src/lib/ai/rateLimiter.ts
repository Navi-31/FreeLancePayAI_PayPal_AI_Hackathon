import { prisma } from "@/lib/db";

/**
 * In-Memory Sliding Window Rate Limiter
 * Enforces per-user AI request limits to prevent denial-of-service, runaway costs, and loops.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const userRateLimits = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
let cleanupTimer: NodeJS.Timeout | null = null;
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - 60000;
    for (const [userId, record] of userRateLimits.entries()) {
      record.timestamps = record.timestamps.filter((t) => t > cutoff);
      if (record.timestamps.length === 0) {
        userRateLimits.delete(userId);
      }
    }
  }, 10 * 60 * 1000);
  cleanupTimer.unref();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Check and record an AI request for a specific user (In-memory sliding window).
 * Default: 30 requests per 60-second window.
 */
export function checkAiRateLimit(
  userId: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = userRateLimits.get(userId);
  if (!record) {
    record = { timestamps: [] };
    userRateLimits.set(userId, record);
  }

  // Filter out timestamps outside window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.max(resetSeconds, 1),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    resetSeconds: Math.ceil(windowMs / 1000),
  };
}

/**
 * Persistent distributed rate limiter using indexed Neon PostgreSQL audit logs.
 * Provides cluster-wide protection across horizontal serverless functions.
 */
export async function checkPersistentRateLimit(
  userId: string,
  action: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const windowStart = new Date(Date.now() - windowSeconds * 1000);
    const count = await prisma.auditLog.count({
      where: {
        userId,
        action,
        timestamp: { gte: windowStart },
      },
    });

    return {
      allowed: count < maxRequests,
      remaining: Math.max(0, maxRequests - count),
    };
  } catch {
    // Graceful fallback to memory check if database is temporarily unreachable
    const mem = checkAiRateLimit(userId, maxRequests, windowSeconds * 1000);
    return { allowed: mem.allowed, remaining: mem.remaining };
  }
}
