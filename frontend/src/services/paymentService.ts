import apiClient from './api';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const loadRazorpay = (): Promise<void> => new Promise((resolve, reject) => {
  if (window.Razorpay) {
    resolve();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('Unable to load Razorpay checkout'));
  document.body.appendChild(script);
});

export const paymentService = {
  createPaymentOrder: async (amount: number, receipt: string) => {
    const response = await apiClient.post('/payments/orders', { amount, receipt });
    return response.data.data;
  },

  verifyPayment: async (data: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const response = await apiClient.post('/payments/verify', data);
    return response.data.data;
  },

  markPaymentFailed: async (orderId: string) => {
    const response = await apiClient.post('/payments/status', { orderId, paymentStatus: 'failed' });
    return response.data.data;
  },

  openCheckout: async (options: Record<string, unknown>) => {
    await loadRazorpay();
    new window.Razorpay(options).open();
  },
};
