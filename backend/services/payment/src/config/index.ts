import dotenv from 'dotenv';

dotenv.config();

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

export const config = {
  port: Number(process.env.PORT) || 3006,
  razorpayKeyId: required('RAZORPAY_KEY_ID'),
  razorpayKeySecret: required('RAZORPAY_KEY_SECRET'),
  ordersServiceUrl: process.env.ORDERS_SERVICE_URL || 'http://localhost:3005',
};