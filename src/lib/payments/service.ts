import { IPaymentService } from "./types";
import { RazorpayPaymentService } from "./razorpay";
import { MockPaymentService } from "./mock";

export function getPaymentService(): IPaymentService {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new RazorpayPaymentService();
  }
  return new MockPaymentService();
}

export const paymentService = getPaymentService();
