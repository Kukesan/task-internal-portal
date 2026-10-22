import { describe, expect, it } from "vitest";
import { RateLimitedError } from "@/lib/errors";
import { FixedWindowRateLimiter } from "@/lib/security/rate-limit";

function limiterAt(limit: number, windowMs: number) {
  let now = 0;
  const limiter = new FixedWindowRateLimiter(limit, windowMs, () => now);
  return { limiter, advance: (ms: number) => (now += ms) };
}

describe("FixedWindowRateLimiter", () => {
  it("allows up to the limit, then throws with a Retry-After", () => {
    const { limiter, advance } = limiterAt(2, 60_000);
    limiter.consume("k");
    limiter.consume("k");
    advance(15_000);

    let error: unknown;
    try {
      limiter.consume("k");
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(RateLimitedError);
    expect((error as RateLimitedError).retryAfterSeconds).toBe(45);
  });

  it("tracks keys independently", () => {
    const { limiter } = limiterAt(1, 60_000);
    limiter.consume("a");
    expect(() => limiter.consume("b")).not.toThrow();
    expect(() => limiter.consume("a")).toThrow(RateLimitedError);
  });

  it("opens a new window once the old one expires", () => {
    const { limiter, advance } = limiterAt(1, 1_000);
    limiter.consume("k");
    advance(1_000);
    expect(() => limiter.consume("k")).not.toThrow();
  });

  it("reset clears a key", () => {
    const { limiter } = limiterAt(1, 60_000);
    limiter.consume("k");
    limiter.reset("k");
    expect(() => limiter.consume("k")).not.toThrow();
  });
});
