import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/security/rateLimiter";

describe("AI Chatbot Security & Rate Limiting Tests", () => {
  it("enforces rate limits on repeated AI queries from the same IP", () => {
    const testIp = `test-chat-ip-${Date.now()}`;
    const maxAllowed = 8;
    const windowSeconds = 60;

    // Send maxAllowed requests
    for (let i = 0; i < maxAllowed; i++) {
      const result = checkRateLimit(testIp, "chat_ai", maxAllowed, windowSeconds);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(maxAllowed - (i + 1));
    }

    // 9th request should be blocked
    const blockedResult = checkRateLimit(testIp, "chat_ai", maxAllowed, windowSeconds);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
    expect(blockedResult.resetSeconds).toBeGreaterThan(0);
  });

  it("validates chat message constraints", () => {
    function validateMessage(msg: any): { valid: boolean; error?: string } {
      if (!msg || typeof msg !== "string") {
        return { valid: false, error: "Invalid payload" };
      }
      const trimmed = msg.trim();
      if (trimmed.length === 0) {
        return { valid: false, error: "Message cannot be empty" };
      }
      if (trimmed.length > 500) {
        return { valid: false, error: "Message exceeds 500 characters" };
      }
      return { valid: true };
    }

    expect(validateMessage("How does We Hear work?").valid).toBe(true);
    expect(validateMessage("").valid).toBe(false);
    expect(validateMessage("   ").valid).toBe(false);
    expect(validateMessage("a".repeat(501)).valid).toBe(false);
    expect(validateMessage(null).valid).toBe(false);
  });

  it("safely sanitizes and limits chat conversation history", () => {
    function sanitizeHistory(rawHistory: any[]): Array<{ role: "user" | "model"; text: string }> {
      if (!Array.isArray(rawHistory)) return [];
      return rawHistory
        .slice(-6)
        .filter(
          (h) =>
            h &&
            (h.role === "user" || h.role === "model") &&
            typeof h.text === "string" &&
            h.text.trim().length > 0
        )
        .map((h) => ({
          role: h.role,
          text: h.text.trim().slice(0, 500),
        }));
    }

    const uncleaned = [
      { role: "user", text: "msg 1" },
      { role: "model", text: "msg 2" },
      { role: "user", text: "msg 3" },
      { role: "model", text: "msg 4" },
      { role: "user", text: "msg 5" },
      { role: "model", text: "msg 6" },
      { role: "user", text: "msg 7" },
      { role: "invalid", text: "bad role" },
      { role: "user", text: 12345 },
    ];

    const cleaned = sanitizeHistory(uncleaned);
    expect(cleaned.length).toBeLessThanOrEqual(6);
    expect(cleaned.every((item) => item.role === "user" || item.role === "model")).toBe(true);
    expect(cleaned.every((item) => typeof item.text === "string")).toBe(true);
  });
});
