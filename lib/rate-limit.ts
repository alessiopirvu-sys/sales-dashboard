type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function applyRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: current.resetAt - now };
  }

  current.count += 1;
  buckets.set(key, current);

  return { allowed: true, remaining: limit - current.count };
}
