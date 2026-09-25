import crypto from 'crypto';
import { bindRazorpayOrder, createRazorpayOrder, getOrder, updateOrderPaymentStatus } from '../clients/paymentClient';
import { config } from '../config';
import { paymentOrdersCreated, paymentStatusUpdates, paymentsVerified } from '../metrics';

export class PaymentError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Loads an order and checks it belongs to the caller and still needs paying. */
async function payableOrder(orderId: string, userId: string) {
  const order = await getOrder(orderId);
  if (!order || order.userId !== userId) throw new PaymentError(404, 'Order not found');
  if (order.status === 'cancelled') throw new PaymentError(409, 'This order was cancelled');
  if (order.paymentStatus === 'paid') throw new PaymentError(409, 'This order is already paid');
  if (!['pending', 'failed'].includes(order.paymentStatus)) throw new PaymentError(409, 'This order cannot be paid');
  return order;
}

/**
 * Creates a Razorpay order for the order's stored total. The amount is never
 * taken from the client, and the Razorpay order id is bound to our order so a
 * payment can only settle the order it was created for.
 */
export const createPaymentOrder = async (orderId: string, userId: string, currency = 'INR') => {
  const order = await payableOrder(orderId, userId);
  const razorpayOrder = await createRazorpayOrder(order.totalAmount, currency, order.id);
  await bindRazorpayOrder(order.id, razorpayOrder.id);
  paymentOrdersCreated.inc();
  return {
    id: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: config.razorpayKeyId,
  };
};

export const verifyPayment = async (
  orderId: string,
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<void> => {
  const order = await getOrder(orderId);
  if (!order || order.userId !== userId) throw new PaymentError(404, 'Order not found');
  if (order.paymentStatus === 'paid') return; // already settled (e.g. a retried callback)
  if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
    throw new PaymentError(400, 'Payment does not belong to this order');
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(razorpaySignature);

  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    throw new PaymentError(400, 'Invalid payment signature');
  }

  await updateOrderPaymentStatus(orderId, 'paid', razorpayPaymentId);
  paymentsVerified.inc();
};

/** A customer abandoned or failed checkout for their own unpaid order. */
export const markPaymentFailed = async (orderId: string, userId: string): Promise<void> => {
  const order = await getOrder(orderId);
  if (!order || order.userId !== userId) throw new PaymentError(404, 'Order not found');
  if (!['pending', 'failed'].includes(order.paymentStatus)) return;
  await updateOrderPaymentStatus(orderId, 'failed');
  paymentStatusUpdates.inc({ status: 'failed' });
};
