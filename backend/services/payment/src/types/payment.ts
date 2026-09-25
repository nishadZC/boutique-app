export interface CreatePaymentOrderRequest {
  orderId?: string;
  /** Ignored: the amount always comes from the stored order. */
  amount?: number;
  currency?: string;
  receipt?: string;
}

export interface VerifyPaymentRequest {
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export interface UpdatePaymentStatusRequest {
  orderId?: string;
  paymentStatus?: 'failed';
}