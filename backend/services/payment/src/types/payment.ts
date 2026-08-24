export interface CreatePaymentOrderRequest {
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
  paymentStatus?: 'failed' | 'refunded';
}