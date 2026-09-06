export interface CreatePaymentOrderParams {
  amountInr: number;
  currency?: string; // "INR" | "USD"
  amountInSmallestUnit?: number; // paise or cents
  userId: string;
  sessionId?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  orderId: string;
  amountInr: number;
  amount?: number;
  currency: string;
  keyId: string;
  isMock: boolean;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature?: string;
  sessionId: string;
}

export interface RefundPaymentParams {
  paymentId: string;
  amountInr: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  status: string;
}

export interface IPaymentService {
  createPayment(params: CreatePaymentOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<boolean>;
  refundPayment(params: RefundPaymentParams): Promise<RefundResult>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
}
