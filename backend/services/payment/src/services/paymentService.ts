import crypto from 'crypto';
import { createRazorpayOrder, updateOrderPaymentStatus } from '../clients/paymentClient';
import { config } from '../config';
import { paymentOrdersCreated, paymentStatusUpdates, paymentsVerified } from '../metrics';

export const createPaymentOrder = async (amount: number, currency: string, receipt: string) => {
  const order = await createRazorpayOrder(amount, currency, receipt);
  paymentOrdersCreated.inc();
  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: config.razorpayKeyId,
  };
};

export const verifyPayment = async (
  orderId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<void> => {
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(razorpaySignature);

  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    throw new Error('Invalid payment signature');
  }

  await updateOrderPaymentStatus(orderId, 'paid', razorpayPaymentId);
  paymentsVerified.inc();
};

export const markPaymentStatus = async (orderId: string, paymentStatus: string): Promise<void> => {
  await updateOrderPaymentStatus(orderId, paymentStatus);
  paymentStatusUpdates.inc({ status: paymentStatus });
};