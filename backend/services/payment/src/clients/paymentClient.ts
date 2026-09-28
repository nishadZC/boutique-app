import axios from 'axios';
import { config } from '../config';

// Every id that goes into a request URL is checked against its exact format
// first, so a tampered value can never change which endpoint is called.
const RAZORPAY_PAYMENT_ID = /^pay_[A-Za-z0-9]+$/;
const ORDER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const safeId = (value: string, pattern: RegExp, name: string): string => {
  if (typeof value !== 'string' || !pattern.test(value)) throw new Error(`Invalid ${name}`);
  return encodeURIComponent(value);
};

export const createRazorpayOrder = async (amount: number, currency: string, receipt: string) => {
  const response = await axios.post(
    'https://api.razorpay.com/v1/orders',
    { amount: Math.round(amount * 100), currency, receipt },
    { auth: { username: config.razorpayKeyId, password: config.razorpayKeySecret }, timeout: 10000 }
  );

  return response.data;
};

export interface RazorpayRefund {
  id: string;
  amount: number;
  status: string;
}

/** Refunds already issued against a payment, so a retried refund never pays out twice. */
export const listRazorpayRefunds = async (paymentId: string): Promise<RazorpayRefund[]> => {
  const response = await axios.get(
    `https://api.razorpay.com/v1/payments/${safeId(paymentId, RAZORPAY_PAYMENT_ID, 'payment id')}/refunds`,
    { auth: { username: config.razorpayKeyId, password: config.razorpayKeySecret }, timeout: 10000 }
  );
  return response.data.items ?? [];
};

export const createRazorpayRefund = async (paymentId: string, amount: number, orderId: string): Promise<RazorpayRefund> => {
  const response = await axios.post(
    `https://api.razorpay.com/v1/payments/${safeId(paymentId, RAZORPAY_PAYMENT_ID, 'payment id')}/refund`,
    { amount: Math.round(amount * 100), speed: 'normal', notes: { orderId } },
    { auth: { username: config.razorpayKeyId, password: config.razorpayKeySecret }, timeout: 15000 }
  );
  return response.data;
};

// ---- Orders service (internal API, authenticated with INTERNAL_API_TOKEN) ----

const internal = () => ({ headers: { 'x-internal-token': config.internalApiToken }, timeout: 5000 });

export interface OrderForPayment {
  id: string;
  userId: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  razorpayOrderId: string | null;
  razorpayPaymentId?: string | null;
}

export const getOrder = async (orderId: string): Promise<OrderForPayment | null> => {
  try {
    const response = await axios.get(`${config.ordersServiceUrl}/internal/orders/${safeId(orderId, ORDER_ID, 'order id')}`, internal());
    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
};

export const bindRazorpayOrder = async (orderId: string, razorpayOrderId: string): Promise<void> => {
  await axios.put(`${config.ordersServiceUrl}/internal/orders/${safeId(orderId, ORDER_ID, 'order id')}/razorpay-order`, { razorpayOrderId }, internal());
};

export const updateOrderPaymentStatus = async (
  orderId: string,
  paymentStatus: string,
  paymentId?: string,
  refund?: { refundId: string; note?: string; actor?: string },
): Promise<void> => {
  await axios.patch(`${config.ordersServiceUrl}/${safeId(orderId, ORDER_ID, 'order id')}/payment-status`, {
    paymentStatus,
    ...(paymentId ? { paymentId } : {}),
    ...(refund ?? {}),
  }, internal());
};
