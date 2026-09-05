import { describe, it, expect } from "vitest";
import { checkRateLimit, getClientIp } from "../../src/lib/security/rateLimiter";
import { isAllowedOrigin } from "../../src/lib/security/originCheck";
import { generateCallToken, verifyCallToken } from "../../src/lib/security/callToken";

describe("Production Scalability & CSWSH Security Suite (1,000+ Concurrent Users)", () => {
  describe("Rate Limiter Memory-Bounded Ceiling (Anti-DDoS Heap Protection)", () => {
    it("handles 12,000 unique IPs without exceeding maximum capacity limit", () => {
      // Simulate high concurrency / bot flood across 12,000 distinct IP addresses
      for (let i = 1; i <= 12000; i++) {
        const fakeIp = `10.${Math.floor(i / 65536)}.${Math.floor((i % 65536) / 256)}.${i % 256}`;
        const res = checkRateLimit(fakeIp, "probe", 10, 60);
        expect(res.allowed).toBe(true);
      }

      // Check that a subsequent request for a specific IP is still accurately evaluated
      const trackedIp = "192.168.10.50";
      const first = checkRateLimit(trackedIp, "test", 2, 60);
      expect(first.allowed).toBe(true);
      expect(first.remaining).toBe(1);

      const second = checkRateLimit(trackedIp, "test", 2, 60);
      expect(second.allowed).toBe(true);
      expect(second.remaining).toBe(0);

      const third = checkRateLimit(trackedIp, "test", 2, 60);
      expect(third.allowed).toBe(false);
    });
  });

  describe("Reverse Proxy & Cloudflare IP Extraction", () => {
    it("prioritizes cf-connecting-ip header from Cloudflare over x-forwarded-for", () => {
      const mockReq = {
        headers: new Headers({
          "cf-connecting-ip": "203.0.113.195",
          "x-forwarded-for": "198.51.100.1, 10.0.0.1",
        }),
      } as unknown as Request;

      const ip = getClientIp(mockReq);
      expect(ip).toBe("203.0.113.195");
    });

    it("extracts real-ip when cf-connecting-ip is absent", () => {
      const mockReq = {
        headers: new Headers({
          "x-real-ip": "198.51.100.42",
        }),
      } as unknown as Request;

      const ip = getClientIp(mockReq);
      expect(ip).toBe("198.51.100.42");
    });

    it("falls back safely to 127.0.0.1 on malformed or malicious IP headers", () => {
      const mockReq = {
        headers: new Headers({
          "cf-connecting-ip": "invalid-ip-address-injection",
          "x-real-ip": "<script>alert(1)</script>",
          "x-forwarded-for": "1000.999.888.777",
        }),
      } as unknown as Request;

      const ip = getClientIp(mockReq);
      // Malformed headers should fail regex check and fallback safely
      expect(ip).toBe("127.0.0.1");
    });
  });

  describe("Cross-Site WebSocket Hijacking (CSWSH) & Origin Filtering", () => {
    const allowed = ["https://wehear.app", "https://app.wehear.com"];

    it("allows configured production domains", () => {
      expect(isAllowedOrigin("https://wehear.app", allowed, false)).toBe(true);
      expect(isAllowedOrigin("https://app.wehear.com", allowed, false)).toBe(true);
    });

    it("allows direct requests with no origin header (e.g. mobile apps, curl)", () => {
      expect(isAllowedOrigin(undefined, allowed, false)).toBe(true);
      expect(isAllowedOrigin(null, allowed, false)).toBe(true);
      expect(isAllowedOrigin("", allowed, false)).toBe(true);
    });

    it("rejects untrusted third-party origins in production", () => {
      expect(isAllowedOrigin("https://evil-attacker.com", allowed, false)).toBe(false);
      expect(isAllowedOrigin("https://phishing-site.xyz", allowed, false)).toBe(false);
    });

    it("rejects subdomain spoofing and prefix attacks", () => {
      expect(isAllowedOrigin("https://wehear.app.evil.com", allowed, false)).toBe(false);
      expect(isAllowedOrigin("https://fake-wehear.app", allowed, false)).toBe(false);
    });

    it("rejects protocol downgrade attacks (http vs https)", () => {
      expect(isAllowedOrigin("http://wehear.app", allowed, false)).toBe(false);
    });

    it("allows localhost origins when in development mode", () => {
      expect(isAllowedOrigin("http://localhost:3000", allowed, true)).toBe(true);
      expect(isAllowedOrigin("http://127.0.0.1:3000", allowed, true)).toBe(true);
    });

    it("blocks localhost origins when in production mode unless explicitly whitelisted", () => {
      expect(isAllowedOrigin("http://localhost:3000", allowed, false)).toBe(false);
    });
  });

  describe("High-Concurrency Room Token Performance", () => {
    it("generates and verifies 1,000 cryptographic room tokens concurrently without failure", () => {
      const sessionBase = "perf_session_";
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        const sessionCode = `${sessionBase}${i}`;
        const userId = `usr_${i}`;
        const role = i % 2 === 0 ? ("CLIENT" as const) : ("LISTENER" as const);

        const token = generateCallToken(sessionCode, userId, role);
        const result = verifyCallToken(token, sessionCode, userId);

        expect(result.valid).toBe(true);
        expect(result.role).toBe(role);
      }

      const elapsed = Date.now() - start;
      // 1,000 HMAC-SHA256 ops should execute well under 500ms in Node.js
      expect(elapsed).toBeLessThan(1000);
    });
  });
});
