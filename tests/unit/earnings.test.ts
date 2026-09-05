import { describe, it, expect } from "vitest";

function evaluateCallEarnings(params: {
  endedByRole: "CLIENT" | "LISTENER" | "TIMEOUT";
  callPriceInr: number;
  listenerRateInr: number;
}) {
  const isEarningEligible =
    params.endedByRole === "CLIENT" || params.endedByRole === "TIMEOUT";

  return {
    isEarningEligible,
    listenerEarnedInr: isEarningEligible ? params.listenerRateInr : 0,
    platformFeeInr: isEarningEligible
      ? params.callPriceInr - params.listenerRateInr
      : params.callPriceInr,
  };
}

describe("Section 12: Authoritative Call Ending & Earnings Rule", () => {
  const callPrice = 20;
  const listenerRate = 15;

  it("credits ₹15 to listener when Client ends call first", () => {
    const result = evaluateCallEarnings({
      endedByRole: "CLIENT",
      callPriceInr: callPrice,
      listenerRateInr: listenerRate,
    });

    expect(result.isEarningEligible).toBe(true);
    expect(result.listenerEarnedInr).toBe(15);
    expect(result.platformFeeInr).toBe(5);
  });

  it("forfeits listener earning (₹0) when Listener ends call first", () => {
    const result = evaluateCallEarnings({
      endedByRole: "LISTENER",
      callPriceInr: callPrice,
      listenerRateInr: listenerRate,
    });

    expect(result.isEarningEligible).toBe(false);
    expect(result.listenerEarnedInr).toBe(0);
    expect(result.platformFeeInr).toBe(20);
  });

  it("credits ₹15 to listener when full 30-min duration expires (TIMEOUT)", () => {
    const result = evaluateCallEarnings({
      endedByRole: "TIMEOUT",
      callPriceInr: callPrice,
      listenerRateInr: listenerRate,
    });

    expect(result.isEarningEligible).toBe(true);
    expect(result.listenerEarnedInr).toBe(15);
  });

  it("prevents double-crediting via idempotency simulation", () => {
    const earningsDb = new Map<string, number>();

    function creditEarningIdempotent(sessionId: string, amount: number) {
      if (earningsDb.has(sessionId)) {
        return { credited: false, existingAmount: earningsDb.get(sessionId) };
      }
      earningsDb.set(sessionId, amount);
      return { credited: true, newAmount: amount };
    }

    const firstAttempt = creditEarningIdempotent("session_123", 15);
    expect(firstAttempt.credited).toBe(true);

    const duplicateAttempt = creditEarningIdempotent("session_123", 15);
    expect(duplicateAttempt.credited).toBe(false);
    expect(duplicateAttempt.existingAmount).toBe(15);
  });
});
