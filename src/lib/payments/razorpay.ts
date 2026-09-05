import crypto from "crypto";
import {
  IPaymentService,
  CreatePaymentOrderParams,
  PaymentOrderResult,
  VerifyPaymentParams,
  RefundPaymentParams,
  RefundResult,
} from "./types";

export class RazorpayPaymentService implements IPaymentService {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || "";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  }

  async createPayment(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: params.amountInr * 100, // Razorpay uses paisa
        currency: "INR",
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay order creation failed: ${errorText}`);
    }

    const data = await response.json();
    return {
      orderId: data.id,
      amountInr: params.amountInr,
      currency: "INR",
      keyId: this.keyId,
      isMock: false,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    if (!params.signature) return false;
    const body = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", this.keySecret)
      .update(body)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(params.signature)
    );
  }

  async refundPayment(params: RefundPaymentParams): Promise<RefundResult> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${params.paymentId}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: params.amountInr * 100,
          notes: { reason: params.reason },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay refund failed: ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      refundId: data.id,
      status: data.status,
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret || !signature) return false;
    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  }
}
