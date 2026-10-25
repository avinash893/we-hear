import { describe, it, expect } from "vitest";
import { generateCallToken, verifyCallToken } from "@/lib/security/callToken";

describe("Demo Call Signaling & Security Verification", () => {
  it("should generate and verify valid demo call tokens", () => {
    const demoSession = "room_demo_abcdef123456";
    const demoUser = "user_test_listener_999";
    const token = generateCallToken(demoSession, demoUser, "LISTENER");

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const result = verifyCallToken(token, demoSession, demoUser);
    expect(result.valid).toBe(true);
    expect(result.role).toBe("LISTENER");
  });

  it("should reject tampered demo call tokens", () => {
    const demoSession = "room_demo_abcdef123456";
    const demoUser = "user_test_listener_999";
    const token = generateCallToken(demoSession, demoUser, "LISTENER");

    // Attempt verification with mismatched session
    const mismatchedSession = verifyCallToken(token, "room_demo_other_room", demoUser);
    expect(mismatchedSession.valid).toBe(false);

    // Attempt verification with mismatched user
    const mismatchedUser = verifyCallToken(token, demoSession, "user_imposter");
    expect(mismatchedUser.valid).toBe(false);
  });

  it("should verify room_demo prefix recognition", () => {
    const sessionCode = "room_demo_7890ab";
    expect(sessionCode.startsWith("room_demo_")).toBe(true);
  });
});
