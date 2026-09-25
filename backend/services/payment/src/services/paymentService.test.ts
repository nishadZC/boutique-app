import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

vi.mock('../config', () => ({
  config: { razorpayKeyId: 'rzp_test', razorpayKeySecret: 'rzp_secret', ordersServiceUrl: 'http://orders', internalApiToken: 't' },
}));
vi.mock('../metrics', () => ({
  paymentOrdersCreated: { inc: vi.fn() }, paymentsVerified: { inc: vi.fn() }, paymentStatusUpdates: { inc: vi.fn() },
}));
vi.mock('../clients/paymentClient', () => ({
  getOrder: vi.fn(), bindRazorpayOrder: vi.fn(), createRazorpayOrder: vi.fn(), updateOrderPaymentStatus: vi.fn(),
}));

import { createPaymentOrder, verifyPayment, markPaymentFailed } from './paymentService';
import { bindRazorpayOrder, createRazorpayOrder, getOrder, updateOrderPaymentStatus } from '../clients/paymentClient';

const ORDER = '33333333-3333-4333-8333-333333333333';
const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '99999999-9999-4999-8999-999999999999';
const sign = (orderId: string, paymentId: string) =>
  crypto.createHmac('sha256', 'rzp_secret').update(`${orderId}|${paymentId}`).digest('hex');
const order = (extra = {}) => ({ id: ORDER, userId: USER, totalAmount: 4999, status: 'pending', paymentStatus: 'pending', razorpayOrderId: 'order_ABC123', ...extra });

beforeEach(() => vi.clearAllMocks());

describe('createPaymentOrder', () => {
  it('charges the stored order total and binds the Razorpay order', async () => {
    vi.mocked(getOrder).mockResolvedValue(order({ razorpayOrderId: null }));
    vi.mocked(createRazorpayOrder).mockResolvedValue({ id: 'order_NEW999', amount: 499900, currency: 'INR' });

    await createPaymentOrder(ORDER, USER);

    expect(createRazorpayOrder).toHaveBeenCalledWith(4999, 'INR', ORDER);
    expect(bindRazorpayOrder).toHaveBeenCalledWith(ORDER, 'order_NEW999');
  });

  it("refuses someone else's order", async () => {
    vi.mocked(getOrder).mockResolvedValue(order());
    await expect(createPaymentOrder(ORDER, OTHER)).rejects.toMatchObject({ status: 404 });
    expect(createRazorpayOrder).not.toHaveBeenCalled();
  });

  it('refuses paid and cancelled orders', async () => {
    vi.mocked(getOrder).mockResolvedValueOnce(order({ paymentStatus: 'paid' })).mockResolvedValueOnce(order({ status: 'cancelled' }));
    await expect(createPaymentOrder(ORDER, USER)).rejects.toMatchObject({ status: 409 });
    await expect(createPaymentOrder(ORDER, USER)).rejects.toMatchObject({ status: 409 });
  });
});

describe('verifyPayment', () => {
  it('marks the order paid for a valid, bound payment', async () => {
    vi.mocked(getOrder).mockResolvedValue(order());
    await verifyPayment(ORDER, USER, 'order_ABC123', 'pay_1', sign('order_ABC123', 'pay_1'));
    expect(updateOrderPaymentStatus).toHaveBeenCalledWith(ORDER, 'paid', 'pay_1');
  });

  it('rejects a genuine payment made for a different Razorpay order', async () => {
    // Regression: a cheap Razorpay order (any amount) could settle an expensive one.
    vi.mocked(getOrder).mockResolvedValue(order());
    await expect(verifyPayment(ORDER, USER, 'order_CHEAP1', 'pay_1', sign('order_CHEAP1', 'pay_1')))
      .rejects.toMatchObject({ status: 400, message: 'Payment does not belong to this order' });
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });

  it('rejects a bad signature', async () => {
    vi.mocked(getOrder).mockResolvedValue(order());
    await expect(verifyPayment(ORDER, USER, 'order_ABC123', 'pay_1', 'f'.repeat(64))).rejects.toMatchObject({ status: 400 });
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });

  it("rejects verifying someone else's order", async () => {
    vi.mocked(getOrder).mockResolvedValue(order());
    await expect(verifyPayment(ORDER, OTHER, 'order_ABC123', 'pay_1', sign('order_ABC123', 'pay_1'))).rejects.toMatchObject({ status: 404 });
  });
});

describe('markPaymentFailed', () => {
  it('never downgrades a paid order', async () => {
    vi.mocked(getOrder).mockResolvedValue(order({ paymentStatus: 'paid' }));
    await markPaymentFailed(ORDER, USER);
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });
});
