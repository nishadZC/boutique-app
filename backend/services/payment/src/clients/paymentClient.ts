import axios from 'axios';
import { config } from '../config';

export const createRazorpayOrder = async (amount: number, currency: string, receipt: string) => {
  const response = await axios.post(
    'https://api.razorpay.com/v1/orders',
    { amount: Math.round(amount * 100), currency, receipt },
    { auth: { username: config.razorpayKeyId, password: config.razorpayKeySecret } }
  );

  return response.data;
};

export const updateOrderPaymentStatus = async (
  orderId: string,
  paymentStatus: string,
  paymentId?: string
): Promise<void> => {
  await axios.patch(`${config.ordersServiceUrl}/${orderId}/payment-status`, {
    paymentStatus,
    ...(paymentId ? { paymentId } : {}),
  });
};