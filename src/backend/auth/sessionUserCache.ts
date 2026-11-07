// User-scoped in-memory cache to accelerate navigation checks & eliminate duplicate database lookups

export interface CachedUserSession {
  user: unknown;
  expiresAt: number;
}

const sessionUserCache = new Map<string, CachedUserSession>();
const USER_CACHE_TTL_MS = 20_000; // 20 seconds TTL

export function invalidateSessionUserCache(userId?: string): void {
  if (userId) {
    sessionUserCache.delete(userId);
  } else {
    sessionUserCache.clear();
  }
}

export function getCachedUserSession(userId: string): unknown | null {
  const cached = sessionUserCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }
  return null;
}

export function setCachedUserSession(userId: string, user: unknown): void {
  sessionUserCache.set(userId, {
    user,
    expiresAt: Date.now() + USER_CACHE_TTL_MS,
  });
}
