import {
  IPaymentService,
  CreatePaymentOrderParams,
  PaymentOrderResult,
  VerifyPaymentParams,
  RefundPaymentParams,
  RefundResult,
} from "./types";
import crypto from "crypto";

export class MockPaymentService implements IPaymentService {
  async createPayment(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Security Error: Mock payment provider is strictly disabled in production.");
    }
    const orderId = `order_mock_${crypto.randomBytes(8).toString("hex")}`;
    const currency = (params.currency || "INR").toUpperCase();
    const amount = params.amountInSmallestUnit ?? Math.round(params.amountInr * 100);
    return {
      orderId,
      amountInr: params.amountInr,
      amount,
      currency,
      keyId: "rzp_test_mock_sandbox",
      isMock: true,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Security Error: Mock payment verification is strictly disabled in production.");
    }
    // In dev mock mode, verify payment if orderId and paymentId are present
    return Boolean(params.orderId && params.paymentId);
  }

  async refundPayment(params: RefundPaymentParams): Promise<RefundResult> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Security Error: Mock refund is strictly disabled in production.");
    }
    return {
      success: true,
      refundId: `rfnd_mock_${crypto.randomBytes(8).toString("hex")}`,
      status: "processed",
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (process.env.NODE_ENV === "production") {
      return false;
    }
    return signature === "mock_webhook_signature";
  }
}
