import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config', () => ({
  config: { razorpayKeyId: 'rzp_test', razorpayKeySecret: 'rzp_secret', ordersServiceUrl: 'http://orders', internalApiToken: 't' },
}));
vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() } }));

import axios from 'axios';
import { bindRazorpayOrder, createRazorpayRefund, getOrder, listRazorpayRefunds, updateOrderPaymentStatus } from './paymentClient';

const ORDER = '33333333-3333-4333-8333-333333333333';

beforeEach(() => vi.clearAllMocks());

describe('request URLs', () => {
  it('calls Razorpay and the orders service for well-formed ids', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { items: [], data: null } });
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 'rfnd_1', amount: 100, status: 'processed' } });

    await listRazorpayRefunds('pay_29QQoUBi66xm2f');
    await createRazorpayRefund('pay_29QQoUBi66xm2f', 1, ORDER);
    await getOrder(ORDER);

    expect(vi.mocked(axios.get).mock.calls[0][0]).toBe('https://api.razorpay.com/v1/payments/pay_29QQoUBi66xm2f/refunds');
    expect(vi.mocked(axios.post).mock.calls[0][0]).toBe('https://api.razorpay.com/v1/payments/pay_29QQoUBi66xm2f/refund');
    expect(vi.mocked(axios.get).mock.calls[1][0]).toBe(`http://orders/internal/orders/${ORDER}`);
  });

  it('refuses a tampered payment id before any request is sent', async () => {
    for (const id of ['pay_1/../../orders', '../orders', 'pay_1?x=1', '', 'order_ABC']) {
      await expect(listRazorpayRefunds(id)).rejects.toThrow('Invalid payment id');
      await expect(createRazorpayRefund(id, 1, ORDER)).rejects.toThrow('Invalid payment id');
    }
    expect(axios.get).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('refuses an order id that is not a UUID before calling the orders service', async () => {
    const bad = '../admin/orders';
    await expect(getOrder(bad)).rejects.toThrow('Invalid order id');
    await expect(bindRazorpayOrder(bad, 'order_ABC')).rejects.toThrow('Invalid order id');
    await expect(updateOrderPaymentStatus(bad, 'failed')).rejects.toThrow('Invalid order id');
    expect(axios.get).not.toHaveBeenCalled();
    expect(axios.put).not.toHaveBeenCalled();
    expect(axios.patch).not.toHaveBeenCalled();
  });
});
