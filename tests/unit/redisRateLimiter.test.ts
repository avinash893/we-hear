import { describe, it, expect } from "vitest";
import { checkRateLimitAsync, checkRateLimit } from "@/lib/security/rateLimiter";

describe("Redis & In-Memory Resilient Rate Limiter", () => {
  it("should allow initial requests within limit", async () => {
    const testId = `unit-test-${Date.now()}-${Math.random()}`;
    const result = await checkRateLimitAsync(testId, "chat_ai", 5, 60);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBeLessThanOrEqual(4);
  });

  it("should block requests when quota is exceeded", async () => {
    const testId = `unit-block-${Date.now()}-${Math.random()}`;
    
    // Send 3 requests with max quota of 2
    const res1 = await checkRateLimitAsync(testId, "test_action", 2, 60);
    const res2 = await checkRateLimitAsync(testId, "test_action", 2, 60);
    const res3 = await checkRateLimitAsync(testId, "test_action", 2, 60);

    expect(res1.allowed).toBe(true);
    expect(res2.allowed).toBe(true);
    expect(res3.allowed).toBe(false);
    expect(res3.remaining).toBe(0);
  });

  it("should maintain synchronous fallback function integrity", () => {
    const testId = `unit-sync-${Date.now()}-${Math.random()}`;
    const res = checkRateLimit(testId, "auth", 10, 60);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(9);
  });
});
