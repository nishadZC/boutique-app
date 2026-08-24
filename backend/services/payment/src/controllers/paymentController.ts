import { Request, Response } from 'express';
import {
  CreatePaymentOrderRequest,
  UpdatePaymentStatusRequest,
  VerifyPaymentRequest,
} from '../types/payment';
import { createPaymentOrder, markPaymentStatus, verifyPayment } from '../services/paymentService';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const { amount, currency = 'INR', receipt } = req.body as CreatePaymentOrderRequest;
  if (!amount || amount <= 0 || !receipt) {
    res.status(400).json({ success: false, error: 'amount and receipt are required' });
    return;
  }

  try {
    const data = await createPaymentOrder(amount, currency, receipt);
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Razorpay order error:', error);
    res.status(502).json({ success: false, error: 'Failed to create payment order' });
  }
};

export const verify = async (req: Request, res: Response): Promise<void> => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as VerifyPaymentRequest;
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400).json({ success: false, error: 'Payment verification fields are required' });
    return;
  }

  try {
    await verifyPayment(orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
    res.json({ success: true, data: { orderId, paymentId: razorpayPaymentId, paymentStatus: 'paid' } });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(error instanceof Error && error.message === 'Invalid payment signature' ? 400 : 502)
      .json({ success: false, error: error instanceof Error && error.message === 'Invalid payment signature' ? error.message : 'Failed to verify payment' });
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  const { orderId, paymentStatus } = req.body as UpdatePaymentStatusRequest;
  if (!orderId || !paymentStatus || !['failed', 'refunded'].includes(paymentStatus)) {
    res.status(400).json({ success: false, error: 'A valid failed payment status is required' });
    return;
  }

  try {
    await markPaymentStatus(orderId, paymentStatus);
    res.json({ success: true, data: { orderId, paymentStatus } });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(502).json({ success: false, error: 'Failed to update payment status' });
  }
};