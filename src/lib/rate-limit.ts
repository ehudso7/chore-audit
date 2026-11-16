/**
 * Fixed-window, in-memory rate limiter.
 *
 * Scope and limits, stated plainly: state lives in one server instance. On a
 * serverless platform each instance counts separately, so this is a
 * best-effort brake on a single noisy client, not a guarantee. The durable
 * control is a platform firewall rule on POST /api/checkout (see
 * docs/RUNBOOK.md). A shared store is not added here because nothing else in
 * this milestone needs one.
 */

export interface RateLimitResult {
  readonly allowed: boolean;
  /** Whole seconds until the current window ends. 0 when allowed. */
  readonly retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

interface Options {
  readonly limit: number;
  readonly windowMs: number;
  /** Upper bound on tracked keys, so memory cannot grow without limit. */
  readonly maxKeys?: number;
  readonly now?: () => number;
}

interface Window {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: Options): RateLimiter {
  const { limit, windowMs } = options;
  const maxKeys = options.maxKeys ?? 10_000;
  const now = options.now ?? Date.now;
  const windows = new Map<string, Window>();

  function prune(currentTime: number): void {
    for (const [key, window] of windows) {
      if (window.resetAt <= currentTime) windows.delete(key);
    }
    // Still full of live windows: drop the oldest insertions.
    while (windows.size >= maxKeys) {
      const oldest = windows.keys().next();
      if (oldest.done) break;
      windows.delete(oldest.value);
    }
  }

  return {
    check(key: string): RateLimitResult {
      const currentTime = now();
      const existing = windows.get(key);

      if (existing === undefined || existing.resetAt <= currentTime) {
        if (windows.size >= maxKeys) prune(currentTime);
        windows.set(key, { count: 1, resetAt: currentTime + windowMs });
        return { allowed: true, retryAfterSeconds: 0 };
      }

      if (existing.count >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - currentTime) / 1000)),
        };
      }

      existing.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
