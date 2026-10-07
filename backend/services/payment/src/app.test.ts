import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

const secrets = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const c = require('crypto') as typeof import('crypto');
  const s = {
    jwt: c.randomBytes(32).toString('hex'),
    internal: c.randomBytes(24).toString('hex'),
    rzp: c.randomBytes(24).toString('hex'),
  };
  process.env.JWT_SECRET = s.jwt;
  process.env.INTERNAL_API_TOKEN = s.internal;
  process.env.RAZORPAY_KEY_SECRET = s.rzp;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
  process.env.ORDERS_SERVICE_URL = 'http://orders';
  return s;
});

vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() } }));

import axios from 'axios';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from './app';

const ORDER = '33333333-3333-4333-8333-333333333333';
const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '99999999-9999-4999-8999-999999999999';
const token = (claims: Record<string, unknown> = {}) =>
  jwt.sign({ userId: USER, email: 'buyer@example.com', role: 'customer', ...claims }, secrets.jwt, { algorithm: 'HS256' });
const admin = () => token({ userId: OTHER, role: 'admin', email: 'admin@example.com' });
const sign = (o: string, p: string) => crypto.createHmac('sha256', secrets.rzp).update(`${o}|${p}`).digest('hex');

const baseOrder = (extra = {}) => ({
  id: ORDER, userId: USER, totalAmount: 4999, status: 'pending', paymentStatus: 'pending', razorpayOrderId: 'order_ABC123', ...extra,
});

const notFound = () => Object.assign(new Error('nf'), { response: { status: 404 } });

let app: ReturnType<typeof createApp>;
beforeEach(() => {
  vi.mocked(axios.get).mockReset();
  vi.mocked(axios.post).mockReset();
  vi.mocked(axios.put).mockReset().mockResolvedValue({ data: {} });
  vi.mocked(axios.patch).mockReset().mockResolvedValue({ data: {} });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  app = createApp();
});
afterEach(() => vi.restoreAllMocks());

/** Route axios.get by URL. */
const routeGet = (order: unknown, refunds: unknown[] | null = []) =>
  vi.mocked(axios.get).mockImplementation(async (url: string) => {
    if (url.includes('razorpay')) return { data: refunds === null ? {} : { items: refunds } };
    if (order instanceof Error) throw order;
    return { data: { data: order } };
  });

describe('app basics', () => {
  it('serves /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  it('rejects unauthenticated and non-admin callers', async () => {
    expect((await request(app).post('/orders').send({})).status).toBe(401);
    expect((await request(app).post(`/admin/orders/${ORDER}/refund`).set('Authorization', `Bearer ${token()}`)).status).toBe(403);
  });
});

describe('POST /orders', () => {
  it('validates the order id and currency', async () => {
    const auth = `Bearer ${token()}`;
    expect((await request(app).post('/orders').set('Authorization', auth).send({ orderId: 'nope' })).status).toBe(400);
    const r = await request(app).post('/orders').set('Authorization', auth).send({ orderId: ORDER, currency: 'USD' });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe('Only INR payments are supported');
  });

  it('creates and binds a Razorpay order for the stored total (accepting legacy receipt)', async () => {
    routeGet(baseOrder({ razorpayOrderId: null, paymentStatus: 'failed' }));
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 'order_NEW', amount: 499900, currency: 'INR' } });
    const res = await request(app).post('/orders').set('Authorization', `Bearer ${token()}`).send({ receipt: ORDER, amount: 1 });
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ id: 'order_NEW', amount: 499900, currency: 'INR', keyId: 'rzp_test_key' });
    const [url, body, opts] = vi.mocked(axios.post).mock.calls[0] as any[];
    expect(url).toBe('https://api.razorpay.com/v1/orders');
    expect(body).toEqual({ amount: 499900, currency: 'INR', receipt: ORDER });
    expect(opts.auth).toEqual({ username: 'rzp_test_key', password: secrets.rzp });
    const [putUrl, putBody, putOpts] = vi.mocked(axios.put).mock.calls[0] as any[];
    expect(putUrl).toBe(`http://orders/internal/orders/${ORDER}/razorpay-order`);
    expect(putBody).toEqual({ razorpayOrderId: 'order_NEW' });
    expect(putOpts.headers['x-internal-token']).toBe(secrets.internal);
  });

  it.each([
    [notFound(), 404, 'Order not found'],
    [baseOrder({ userId: OTHER }), 404, 'Order not found'],
    [baseOrder({ status: 'cancelled' }), 409, 'This order was cancelled'],
    [baseOrder({ paymentStatus: 'paid' }), 409, 'This order is already paid'],
    [baseOrder({ paymentStatus: 'refunded' }), 409, 'This order cannot be paid'],
  ])('maps payable-order failures (%#)', async (order, status, error) => {
    routeGet(order);
    const res = await request(app).post('/orders').set('Authorization', `Bearer ${token()}`).send({ orderId: ORDER });
    expect(res.status).toBe(status);
    expect(res.body.error).toBe(error);
  });

  it('returns 502 when an upstream call fails', async () => {
    routeGet(Object.assign(new Error('boom'), { response: { status: 500 } }));
    const res = await request(app).post('/orders').set('Authorization', `Bearer ${token()}`).send({ orderId: ORDER });
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('Failed to create payment order');
  });
});

describe('POST /verify', () => {
  const body = (extra = {}) => ({
    orderId: ORDER, razorpayOrderId: 'order_ABC123', razorpayPaymentId: 'pay_1', razorpaySignature: sign('order_ABC123', 'pay_1'), ...extra,
  });

  it('requires all fields', async () => {
    const res = await request(app).post('/verify').set('Authorization', `Bearer ${token()}`).send({ orderId: ORDER });
    expect(res.status).toBe(400);
  });

  it('marks the order paid', async () => {
    routeGet(baseOrder());
    const res = await request(app).post('/verify').set('Authorization', `Bearer ${token()}`).send(body());
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ orderId: ORDER, paymentId: 'pay_1', paymentStatus: 'paid' });
    const [patchUrl, patchBody, patchOpts] = vi.mocked(axios.patch).mock.calls[0] as any[];
    expect(patchUrl).toBe(`http://orders/${ORDER}/payment-status`);
    expect(patchBody).toEqual({ paymentStatus: 'paid', paymentId: 'pay_1' });
    expect(patchOpts.headers['x-internal-token']).toBe(secrets.internal);
  });

  it('rejects a non-UUID order id', async () => {
    const res = await request(app).post('/verify').set('Authorization', `Bearer ${token()}`).send(body({ orderId: 'abc' }));
    expect(res.status).toBe(400);
  });

  it('is a no-op for an already-paid order', async () => {
    routeGet(baseOrder({ paymentStatus: 'paid' }));
    expect((await request(app).post('/verify').set('Authorization', `Bearer ${token()}`).send(body())).status).toBe(200);
    expect(axios.patch).not.toHaveBeenCalled();
  });

  it('rejects mismatched orders, short or wrong signatures and foreign orders', async () => {
    const auth = `Bearer ${token()}`;
    routeGet(baseOrder({ razorpayOrderId: null }));
    expect((await request(app).post('/verify').set('Authorization', auth).send(body())).body.error).toBe('Payment does not belong to this order');
    routeGet(baseOrder());
    let r = await request(app).post('/verify').set('Authorization', auth).send(body({ razorpaySignature: 'short' }));
    expect(r.status).toBe(400);
    expect(r.body.error).toBe('Invalid payment signature');
    const wrongKey = crypto.createHmac('sha256', crypto.randomBytes(16)).update('order_ABC123|pay_1').digest('hex');
    r = await request(app).post('/verify').set('Authorization', auth).send(body({ razorpaySignature: wrongKey }));
    expect(r.body.error).toBe('Invalid payment signature');
    routeGet(baseOrder({ userId: OTHER }));
    expect((await request(app).post('/verify').set('Authorization', auth).send(body())).status).toBe(404);
    expect(axios.patch).not.toHaveBeenCalled();
  });

  it('returns 502 on unexpected errors', async () => {
    routeGet(baseOrder());
    vi.mocked(axios.patch).mockRejectedValue(new Error('down'));
    const r = await request(app).post('/verify').set('Authorization', `Bearer ${token()}`).send(body());
    expect(r.status).toBe(502);
    expect(r.body.error).toBe('Failed to verify payment');
  });
});

describe('POST /status', () => {
  it('only accepts a failed status for a UUID', async () => {
    const auth = `Bearer ${token()}`;
    expect((await request(app).post('/status').set('Authorization', auth).send({ orderId: ORDER, paymentStatus: 'paid' })).status).toBe(400);
    expect((await request(app).post('/status').set('Authorization', auth).send({ orderId: 'x', paymentStatus: 'failed' })).status).toBe(400);
  });

  it('marks a pending order failed', async () => {
    routeGet(baseOrder());
    const r = await request(app).post('/status').set('Authorization', `Bearer ${token()}`).send({ orderId: ORDER, paymentStatus: 'failed' });
    expect(r.status).toBe(200);
    expect((vi.mocked(axios.patch).mock.calls[0] as any[])[1]).toEqual({ paymentStatus: 'failed' });
  });

  it('404s for foreign orders and 502s on upstream errors', async () => {
    routeGet(baseOrder({ userId: OTHER }));
    expect((await request(app).post('/status').set('Authorization', `Bearer ${token()}`).send({ orderId: ORDER, paymentStatus: 'failed' })).status).toBe(404);
    routeGet(new Error('down'));
    expect((await request(app).post('/status').set('Authorization', `Bearer ${token()}`).send({ orderId: ORDER, paymentStatus: 'failed' })).status).toBe(502);
  });
});

describe('POST /admin/orders/:id/refund', () => {
  const paid = (extra = {}) => baseOrder({ paymentStatus: 'paid', razorpayPaymentId: 'pay_ABC', ...extra });
  const refundUrl = `/admin/orders/${ORDER}/refund`;

  it('404s for a non-UUID id', async () => {
    expect((await request(app).post('/admin/orders/xyz/refund').set('Authorization', `Bearer ${admin()}`)).status).toBe(404);
  });

  it('issues a new refund and records it', async () => {
    routeGet(paid(), [{ id: 'rfnd_old', amount: 499900, status: 'failed' }]);
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 'rfnd_1', amount: 499900, status: 'processed' } });
    const res = await request(app).post(refundUrl).set('Authorization', `Bearer ${admin()}`)
      .send({ note: '  customer return  ' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { orderId: ORDER, refundId: 'rfnd_1', amount: 4999 }, message: 'Refund issued' });
    const [url, body] = vi.mocked(axios.post).mock.calls[0] as any[];
    expect(url).toBe('https://api.razorpay.com/v1/payments/pay_ABC/refund');
    expect(body).toEqual({ amount: 499900, speed: 'normal', notes: { orderId: ORDER } });
    expect((vi.mocked(axios.patch).mock.calls[0] as any[])[1]).toEqual({
      paymentStatus: 'refunded', refundId: 'rfnd_1', note: 'customer return', actor: 'admin@example.com',
    });
  });

  it('reuses an existing refund instead of paying out twice (idempotent retry)', async () => {
    routeGet(paid(), [{ id: 'rfnd_prev', amount: 499900, status: 'processed' }]);
    const res = await request(app).post(refundUrl).set('Authorization', `Bearer ${token({ userId: OTHER, role: 'admin', email: undefined })}`).send();
    expect(res.status).toBe(200);
    expect(res.body.data.refundId).toBe('rfnd_prev');
    expect(axios.post).not.toHaveBeenCalled();
    expect((vi.mocked(axios.patch).mock.calls[0] as any[])[1]).toEqual({
      paymentStatus: 'refunded', refundId: 'rfnd_prev', note: 'Razorpay refund rfnd_prev', actor: OTHER,
    });
  });

  it('handles a Razorpay refunds list without items and a non-string note', async () => {
    routeGet(paid(), null);
    vi.mocked(axios.post).mockResolvedValue({ data: { id: 'rfnd_2', amount: 499900, status: 'processed' } });
    const res = await request(app).post(refundUrl).set('Authorization', `Bearer ${admin()}`).send({ note: 42 });
    expect(res.status).toBe(200);
    expect((vi.mocked(axios.patch).mock.calls[0] as any[])[1]).toMatchObject({ refundId: 'rfnd_2', note: 'Razorpay refund rfnd_2' });
  });

  it.each([
    [notFound(), 404, 'Order not found'],
    [baseOrder({ paymentStatus: 'refunded' }), 409, 'This order has already been refunded'],
    [baseOrder({ paymentStatus: 'pending' }), 409, 'Only paid orders can be refunded'],
    [baseOrder({ paymentStatus: 'paid' }), 409, 'No Razorpay payment is recorded for this order; record the refund manually'],
  ])('rejects ineligible orders (%#)', async (order, status, error) => {
    routeGet(order);
    const res = await request(app).post(refundUrl).set('Authorization', `Bearer ${admin()}`).send({});
    expect(res.status).toBe(status);
    expect(res.body.error).toBe(error);
  });

  it('502s when Razorpay fails', async () => {
    routeGet(paid());
    vi.mocked(axios.post).mockRejectedValue(new Error('rzp down'));
    const res = await request(app).post(refundUrl).set('Authorization', `Bearer ${admin()}`).send({});
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('Refund failed; check the payment in Razorpay before retrying');
    expect(axios.patch).not.toHaveBeenCalled();
  });
});
