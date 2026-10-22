import { RateLimitedError } from "@/lib/errors";

type Window = { count: number; resetAt: number };

/**
 * Fixed-window, in-memory rate limiter.
 *
 * Good enough for a single Node process. It resets on restart and is not shared between
 * instances, so production should back this with Redis or an edge KV store.
 */
export class FixedWindowRateLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Records a hit for `key`; throws RateLimitedError once the limit is exceeded. */
  consume(key: string): void {
    const now = this.now();
    this.pruneExpired(now);

    const current = this.windows.get(key);
    if (!current || current.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    current.count += 1;
    if (current.count > this.limit) {
      throw new RateLimitedError(Math.ceil((current.resetAt - now) / 1000));
    }
  }

  reset(key: string): void {
    this.windows.delete(key);
  }

  private pruneExpired(now: number): void {
    // Opportunistic cleanup keeps memory bounded without a timer.
    if (this.windows.size < 1000) return;
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) this.windows.delete(key);
    }
  }
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

export const loginLimiter = {
  byIp: new FixedWindowRateLimiter(20, FIFTEEN_MINUTES),
  byEmail: new FixedWindowRateLimiter(10, FIFTEEN_MINUTES),
};

export const signupLimiter = new FixedWindowRateLimiter(5, ONE_HOUR);
