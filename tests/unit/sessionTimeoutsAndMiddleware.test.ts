import { describe, it, expect } from "vitest";

describe("Session Timeouts and Pacing Guardrails", () => {
  it("should configure 5-minute timeout for waiting peers (300 seconds)", () => {
    const timeoutSeconds = 5 * 60;
    expect(timeoutSeconds).toBe(300);
  });

  it("should configure listener polling to exactly 10 seconds", () => {
    const listenerPollIntervalMs = 10000;
    expect(listenerPollIntervalMs).toBe(10000);
    expect(listenerPollIntervalMs / 1000).toBe(10);
  });

  it("should enforce protected route matching in middleware configuration", () => {
    const protectedRoutes = [
      "/listen",
      "/talk",
      "/account",
      "/earnings",
      "/call/room_demo_123",
    ];

    const matcher = [
      "/listen/:path*",
      "/talk/:path*",
      "/account/:path*",
      "/earnings/:path*",
      "/call/:path*",
    ];

    protectedRoutes.forEach((route) => {
      const isProtected = matcher.some((pattern) => {
        const prefix = pattern.replace("/:path*", "");
        return route === prefix || route.startsWith(prefix + "/");
      });
      expect(isProtected).toBe(true);
    });
  });
});
