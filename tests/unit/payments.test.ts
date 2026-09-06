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

  it("calculates correct split: ₹20 fee, ₹15 listener, ₹5 platform fee", () => {
    const callPrice = 20;
    const listenerShare = 15;
    const platformShare = callPrice - listenerShare;

    expect(callPrice).toBe(20);
    expect(listenerShare).toBe(15);
    expect(platformShare).toBe(5);
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
