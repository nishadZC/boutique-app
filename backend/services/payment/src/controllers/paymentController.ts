import { Request, Response } from 'express';
import { CreatePaymentOrderRequest, RefundOrderRequest, UpdatePaymentStatusRequest, VerifyPaymentRequest } from '../types/payment';
import { PaymentError, createPaymentOrder, markPaymentFailed, refundOrder, verifyPayment } from '../services/paymentService';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fail = (res: Response, error: unknown, fallback: string) => {
  if (error instanceof PaymentError) {
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  console.error(fallback, error);
  res.status(502).json({ success: false, error: fallback });
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  // `receipt` is accepted for older clients; any `amount` sent is ignored.
  const { orderId, receipt, currency = 'INR' } = req.body as CreatePaymentOrderRequest;
  const id = orderId ?? receipt;
  if (!id || !UUID.test(id)) {
    res.status(400).json({ success: false, error: 'orderId is required' });
    return;
  }
  if (currency !== 'INR') {
    res.status(400).json({ success: false, error: 'Only INR payments are supported' });
    return;
  }

  try {
    const data = await createPaymentOrder(id, req.auth!.userId, currency);
    res.status(201).json({ success: true, data });
  } catch (error) {
    fail(res, error, 'Failed to create payment order');
  }
};

export const verify = async (req: Request, res: Response): Promise<void> => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as VerifyPaymentRequest;
  if (!orderId || !UUID.test(orderId) || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400).json({ success: false, error: 'Payment verification fields are required' });
    return;
  }

  try {
    await verifyPayment(orderId, req.auth!.userId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
    res.json({ success: true, data: { orderId, paymentId: razorpayPaymentId, paymentStatus: 'paid' } });
  } catch (error) {
    fail(res, error, 'Failed to verify payment');
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  const { orderId, paymentStatus } = req.body as UpdatePaymentStatusRequest;
  // Customers can only report a failed attempt; refunds are recorded by an admin.
  if (!orderId || !UUID.test(orderId) || paymentStatus !== 'failed') {
    res.status(400).json({ success: false, error: 'A valid failed payment status is required' });
    return;
  }

  try {
    await markPaymentFailed(orderId, req.auth!.userId);
    res.json({ success: true, data: { orderId, paymentStatus } });
  } catch (error) {
    fail(res, error, 'Failed to update payment status');
  }
};

/** Admin: refund an order in full through Razorpay (approves a cancellation or return). */
export const refund = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!UUID.test(id)) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }
  const { note } = (req.body ?? {}) as RefundOrderRequest;
  try {
    const data = await refundOrder(id, req.auth!.email || req.auth!.userId, typeof note === 'string' ? note.trim().slice(0, 500) : '');
    res.json({ success: true, data, message: 'Refund issued' });
  } catch (error) {
    fail(res, error, 'Refund failed; check the payment in Razorpay before retrying');
  }
};
