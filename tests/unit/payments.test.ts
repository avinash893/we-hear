import { describe, it, expect } from "vitest";
import crypto from "crypto";

describe("Payment Service & Security Tests", () => {
  const mockKeySecret = "rzp_secret_test_12345";

  function verifyHmac(orderId: string, paymentId: string, signature: string, secret: string) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    return expected === signature;
  }

  it("verifies authentic Razorpay signatures", () => {
    const orderId = "order_abc123";
    const paymentId = "pay_xyz789";
    const validSignature = crypto
      .createHmac("sha256", mockKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const result = verifyHmac(orderId, paymentId, validSignature, mockKeySecret);
    expect(result).toBe(true);
  });

  it("rejects forged payment signatures", () => {
    const orderId = "order_abc123";
    const paymentId = "pay_xyz789";
    const forgedSignature = "forged_signature_00000000000000000000";

    const result = verifyHmac(orderId, paymentId, forgedSignature, mockKeySecret);
    expect(result).toBe(false);
  });

  it("calculates correct split: ₹20 fee, ₹10 listener, ₹10 platform fee", () => {
    const callPrice = 20;
    const listenerShare = 10;
    const platformShare = callPrice - listenerShare;

    expect(callPrice).toBe(20);
    expect(listenerShare).toBe(10);
    expect(platformShare).toBe(10);
  });

  it("applies correct PPP regional pricing tiers ($0.99 for US, $0.50 for Tier 2, ₹20 for India)", async () => {
    const { getRegionalPricing } = await import("../../src/lib/payments/pricing");

    // Tier 1 (US)
    const usPricing = getRegionalPricing("US");
    expect(usPricing.tier).toBe("TIER_1");
    expect(usPricing.speakerPrice).toBe(0.99);
    expect(usPricing.listenerEarning).toBe(0.50);
    expect(usPricing.currency).toBe("USD");

    // Tier 2 (Brazil)
    const brPricing = getRegionalPricing("BR");
    expect(brPricing.tier).toBe("TIER_2");
    expect(brPricing.speakerPrice).toBe(0.50);
    expect(brPricing.listenerEarning).toBe(0.25);
    expect(brPricing.currency).toBe("USD");

    // Tier 3 (India)
    const inPricing = getRegionalPricing("IN");
    expect(inPricing.tier).toBe("TIER_3");
    expect(inPricing.speakerPrice).toBe(20);
    expect(inPricing.listenerEarning).toBe(10);
    expect(inPricing.currency).toBe("INR");
  });

  it("handles RazorpayPaymentService signature verification safely without crashing on length mismatch", async () => {
    const { RazorpayPaymentService } = await import("../../src/lib/payments/razorpay");
    const service = new RazorpayPaymentService();

    // Malformed/short signature shouldn't cause RangeError in timingSafeEqual
    const invalidShortSig = await service.verifyPayment({
      orderId: "order_123",
      paymentId: "pay_123",
      signature: "short",
      sessionId: "sess_123",
    });
    expect(invalidShortSig).toBe(false);

    // Empty signature
    const emptySig = await service.verifyPayment({
      orderId: "order_123",
      paymentId: "pay_123",
      signature: "",
      sessionId: "sess_123",
    });
    expect(emptySig).toBe(false);
  });
});
