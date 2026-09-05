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
    const orderId = `order_mock_${crypto.randomBytes(8).toString("hex")}`;
    return {
      orderId,
      amountInr: params.amountInr,
      currency: "INR",
      keyId: "rzp_test_mock_sandbox",
      isMock: true,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    // In mock mode, verify payment if orderId and paymentId are present
    return Boolean(params.orderId && params.paymentId);
  }

  async refundPayment(params: RefundPaymentParams): Promise<RefundResult> {
    return {
      success: true,
      refundId: `rfnd_mock_${crypto.randomBytes(8).toString("hex")}`,
      status: "processed",
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    return signature === "mock_webhook_signature" || process.env.NODE_ENV !== "production";
  }
}
