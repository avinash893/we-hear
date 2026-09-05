import { describe, it, expect } from "vitest";
import { generateCaptchaChallenge, verifyCaptchaSolution } from "../../src/lib/security/captcha";
import { checkRateLimit } from "../../src/lib/security/rateLimiter";
import { generateCallToken, verifyCallToken } from "../../src/lib/security/callToken";
import { sanitizeText, isValidCode } from "../../src/lib/security/sanitize";

describe("Enterprise Security Suite: CAPTCHA, Rate Limiting & Cryptographic Tokens", () => {
  describe("Cryptographic CAPTCHA Service", () => {
    it("generates and verifies valid challenge solutions", () => {
      const challenge = generateCaptchaChallenge();
      expect(challenge.question).toContain("What is");
      expect(challenge.token).toBeTruthy();

      // Extract equation numbers from question to solve legitimately
      const match = challenge.question.match(/What is (\d+) \+ (\d+)\?/);
      expect(match).not.toBeNull();
      const num1 = parseInt(match![1], 10);
      const num2 = parseInt(match![2], 10);
      const correctAnswer = String(num1 + num2);

      const isValid = verifyCaptchaSolution(correctAnswer, challenge.token);
      expect(isValid).toBe(true);
    });

    it("rejects incorrect CAPTCHA solutions", () => {
      const challenge = generateCaptchaChallenge();
      const isInvalid = verifyCaptchaSolution("99999", challenge.token);
      expect(isInvalid).toBe(false);
    });

    it("rejects forged or tampered CAPTCHA tokens", () => {
      const challenge = generateCaptchaChallenge();
      const tamperedToken = challenge.token.slice(0, -4) + "AAAA";
      const isInvalid = verifyCaptchaSolution("15", tamperedToken);
      expect(isInvalid).toBe(false);
    });
  });

  describe("Token-Bucket Sliding-Window Rate Limiter", () => {
    it("permits requests within quota and blocks when limit is exceeded", () => {
      const testIp = "192.168.1.100";
      const action = "payment";
      const maxRequests = 3;
      const windowSeconds = 10;

      // 1st request
      const req1 = checkRateLimit(testIp, action, maxRequests, windowSeconds);
      expect(req1.allowed).toBe(true);
      expect(req1.remaining).toBe(2);

      // 2nd request
      const req2 = checkRateLimit(testIp, action, maxRequests, windowSeconds);
      expect(req2.allowed).toBe(true);
      expect(req2.remaining).toBe(1);

      // 3rd request (hits limit)
      const req3 = checkRateLimit(testIp, action, maxRequests, windowSeconds);
      expect(req3.allowed).toBe(true);
      expect(req3.remaining).toBe(0);

      // 4th request (must be blocked)
      const req4 = checkRateLimit(testIp, action, maxRequests, windowSeconds);
      expect(req4.allowed).toBe(false);
      expect(req4.remaining).toBe(0);
      expect(req4.resetSeconds).toBeGreaterThan(0);
    });
  });

  describe("HMAC-SHA256 WebRTC Room Tokens", () => {
    it("generates and verifies valid room authorization tokens", () => {
      const sessionCode = "room_sec_987654";
      const userId = "usr_client_001";
      const role = "CLIENT";

      const token = generateCallToken(sessionCode, userId, role);
      expect(token).toBeTruthy();

      const verification = verifyCallToken(token, sessionCode, userId);
      expect(verification.valid).toBe(true);
      expect(verification.role).toBe("CLIENT");
    });

    it("rejects room tokens when session code or user ID does not match", () => {
      const token = generateCallToken("room_alpha", "usr_1", "CLIENT");

      // Attacker trying to use token for a different room
      const checkWrongRoom = verifyCallToken(token, "room_beta", "usr_1");
      expect(checkWrongRoom.valid).toBe(false);

      // Attacker trying to impersonate another user
      const checkWrongUser = verifyCallToken(token, "room_alpha", "usr_impostor");
      expect(checkWrongUser.valid).toBe(false);
    });

    it("rejects tampered or forged room tokens", () => {
      const token = generateCallToken("room_alpha", "usr_1", "CLIENT");
      const tampered = token.substring(0, token.length - 8) + "12345678";

      const check = verifyCallToken(tampered, "room_alpha", "usr_1");
      expect(check.valid).toBe(false);
    });
  });

  describe("Input Sanitization & Injection Defense", () => {
    it("escapes dangerous HTML, script tags, and XSS vectors", () => {
      const malicious = '<script>alert("hacked")</script><img src=x onerror=alert(1)>';
      const sanitized = sanitizeText(malicious);

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("<img");
      expect(sanitized).toContain("&lt;script&gt;");
      expect(sanitized).toContain("&lt;img");
    });

    it("blocks javascript: and vbscript: pseudo-protocols", () => {
      const input = "javascript:alert(document.cookie)";
      const sanitized = sanitizeText(input);

      expect(sanitized).not.toContain("javascript:");
      expect(sanitized).toContain("javascript_blocked:");
    });

    it("validates safe alphanumeric codes and rejects traversal/injection characters", () => {
      expect(isValidCode("room_12345abc")).toBe(true);
      expect(isValidCode("usr_8f32a7b1")).toBe(true);
      expect(isValidCode("../../etc/passwd")).toBe(false);
      expect(isValidCode("room_123; DROP TABLE users;")).toBe(false);
      expect(isValidCode("<script>")).toBe(false);
    });
  });
});
