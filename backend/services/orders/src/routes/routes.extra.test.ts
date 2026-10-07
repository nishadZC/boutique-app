import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const client = { query: vi.fn(), release: vi.fn() };
vi.mock('../database/connection', () => ({
  query: vi.fn(),
  getPool: () => ({ connect: async () => client }),
}));
vi.mock('../clients/productClient', () => ({
  getProducts: vi.fn(async () => new Map()),
  getProduct: vi.fn(),
  commitStock: vi.fn(async () => ({ shortages: [] })),
}));
vi.mock('../services/orderService', async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    changeOrderStatus: vi.fn(), changePaymentStatus: vi.fn(), customerCancel: vi.fn(),
    requestReturn: vi.fn(), rejectRequest: vi.fn(),
  };
});

import { orderRoutes } from './orders';
import { adminRoutes } from './admin';
import { internalRoutes } from './internal';
import { query } from '../database/connection';
import { getProducts } from '../clients/productClient';
import * as svc from '../services/orderService';

const JWT_SECRET = randomBytes(32).toString('hex');
const INTERNAL = randomBytes(24).toString('hex');
process.env.JWT_SECRET = JWT_SECRET;
process.env.INTERNAL_API_TOKEN = INTERNAL;

const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);
app.use('/internal', internalRoutes);
app.use('', orderRoutes);

const mq = vi.mocked(query);
const mProducts = vi.mocked(getProducts);
const USER = '11111111-1111-4111-8111-111111111111';
const PRODUCT = '22222222-2222-4222-8222-222222222222';
const ORDER = '33333333-3333-4333-8333-333333333333';
const REQ = '44444444-4444-4444-8444-444444444444';
const token = (c: object) => `Bearer ${jwt.sign(c, JWT_SECRET)}`;
const customer = token({ userId: USER, email: 'jane@example.com', role: 'customer' });
const admin = token({ userId: USER, email: 'owner@example.com', role: 'admin' });
const row = { id: ORDER, user_id: USER, status: 'confirmed', payment_status: 'paid', total_amount: '100', razorpay_order_id: 'order_x' };
const boom = () => { throw new Error('db down'); };

beforeEach(() => {
  vi.clearAllMocks();
  client.query.mockReset();
  mq.mockReset();
  mProducts.mockResolvedValue(new Map());
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('internal routes', () => {
  const get = (p: string) => request(app).get(`/internal${p}`).set('x-internal-token', INTERNAL);
  it('404s a bad id and a missing order', async () => {
    expect((await get('/orders/nope')).status).toBe(404);
    mq.mockResolvedValueOnce({ rows: [] } as any);
    expect((await get(`/orders/${ORDER}`)).status).toBe(404);
  });
  it('returns the payment view', async () => {
    mq.mockResolvedValueOnce({ rows: [row] } as any);
    const res = await get(`/orders/${ORDER}`);
    expect(res.body.data).toMatchObject({ id: ORDER, totalAmount: 100, razorpayOrderId: 'order_x' });
  });
  it('500s on db error', async () => {
    mq.mockImplementationOnce(boom as any);
    expect((await get(`/orders/${ORDER}`)).status).toBe(500);
  });
  it('has no internal invoice route (boutique renders invoices in the browser)', async () => {
    const res = await get(`/orders/${ORDER}/invoice`);
    expect(res.status).toBe(404);
    expect(mq).not.toHaveBeenCalled();
  });
  it('binds a razorpay order', async () => {
    const put = (body: any) => request(app).put(`/internal/orders/${ORDER}/razorpay-order`).set('x-internal-token', INTERNAL).send(body);
    expect((await put({ razorpayOrderId: 'bad' })).status).toBe(400);
    mq.mockResolvedValueOnce({ rowCount: 0 } as any);
    expect((await put({ razorpayOrderId: 'order_abc123' })).status).toBe(409);
    mq.mockResolvedValueOnce({ rowCount: 1 } as any);
    expect((await put({ razorpayOrderId: 'order_abc123' })).body).toEqual({ success: true });
    mq.mockImplementationOnce(boom as any);
    expect((await put({ razorpayOrderId: 'order_abc123' })).status).toBe(500);
  });
  it('checks review eligibility', async () => {
    const elig = () => get(`/orders/${ORDER}/review-eligibility?userId=${USER}&productId=${PRODUCT}`);
    expect((await get(`/orders/${ORDER}/review-eligibility?userId=x`)).status).toBe(400);
    mq.mockResolvedValueOnce({ rows: [] } as any);
    expect((await elig()).body.data.reason).toBe('Order not found');
    mq.mockResolvedValueOnce({ rows: [{ status: 'delivered', user_id: USER, has_item: false }] } as any);
    expect((await elig()).body.data.reason).toBe('This item is not part of the order');
    mq.mockResolvedValueOnce({ rows: [{ status: 'delivered', user_id: USER, has_item: true }] } as any);
    expect((await elig()).body.data).toEqual({ eligible: true, reason: null });
    mq.mockImplementationOnce(boom as any);
    expect((await elig()).status).toBe(500);
  });
});

describe('admin routes', () => {
  const as = (m: 'get' | 'post' | 'patch', p: string) => request(app)[m](`/admin${p}`).set('Authorization', admin);
  it('lists orders with every filter', async () => {
    mq.mockResolvedValueOnce({ rows: [{ ...row, item_count: '2', open_request: null }] } as any).mockResolvedValueOnce({ rows: [{ total: '1' }] } as any);
    const res = await as('get', `/orders?status=packed&paymentStatus=paid&userId=${USER}&search=33zz&from=2024-01-01&to=2024-02-01&page=2&limit=10`);
    expect(res.status).toBe(200);
    expect(res.body.data.orders[0]).toMatchObject({ itemCount: 2, openRequest: null, nextStatus: 'packed' });
    expect(res.body.data.pagination).toEqual({ page: 2, limit: 10, total: 1, totalPages: 1 });
    expect(mq.mock.calls[0][1]).toEqual(['packed', 'paid', USER, '33%', expect.anything(), expect.anything(), 10, 10]);
  });
  it.each(['awaiting_fulfilment', 'refund_requests', 'in_transit', 'confirmed'])('handles status group %s', async (s) => {
    mq.mockResolvedValueOnce({ rows: [] } as any).mockResolvedValueOnce({ rows: [{ total: '0' }] } as any);
    expect((await as('get', `/orders?status=${s}`)).status).toBe(200);
    expect(mq.mock.calls[1][0]).toContain('WHERE');
  });
  it('rejects bad filters and handles errors', async () => {
    expect((await as('get', '/orders?status=zzz')).status).toBe(400);
    mq.mockImplementation(boom as any);
    expect((await as('get', '/orders')).status).toBe(500);
  });
  it('gets one order', async () => {
    expect((await as('get', '/orders/abc')).status).toBe(404);
    mq.mockResolvedValueOnce({ rows: [] } as any);
    expect((await as('get', `/orders/${ORDER}`)).status).toBe(404);
    mq.mockImplementation(async (sql: string) => {
      if (sql.startsWith('SELECT * FROM orders')) return { rows: [row] } as any;
      if (sql.includes('order_requests')) return { rows: [{ order_id: ORDER, id: REQ, type: 'return' }] } as any;
      return { rows: [] } as any;
    });
    const res = await as('get', `/orders/${ORDER}`);
    expect(res.body.data).toMatchObject({ razorpayOrderId: 'order_x', items: [], events: [], nextStatus: 'packed' });
    expect(res.body.data.requests).toHaveLength(1);
    mq.mockImplementation(boom as any);
    expect((await as('get', `/orders/${ORDER}`)).status).toBe(500);
  });
  it('changes status', async () => {
    vi.mocked(svc.changeOrderStatus).mockResolvedValueOnce({ order: { id: ORDER } as any, refundRequired: true, message: 'm' });
    const res = await as('patch', `/orders/${ORDER}/status`).send({ status: 'cancelled', note: 'x' });
    expect(res.body).toMatchObject({ success: true, refundRequired: true, message: 'm' });
    expect(svc.changeOrderStatus).toHaveBeenCalledWith(ORDER, 'cancelled', 'owner@example.com', 'x');
    vi.mocked(svc.changeOrderStatus).mockRejectedValueOnce(new Error('x'));
    expect((await as('patch', `/orders/${ORDER}/status`).send({ status: 'packed' })).status).toBe(500);
  });
  it('records refunds', async () => {
    expect((await as('post', `/orders/${ORDER}/refund`).send({ note: '  ' })).status).toBe(400);
    vi.mocked(svc.changePaymentStatus).mockResolvedValueOnce({ id: ORDER } as any);
    expect((await as('post', `/orders/${ORDER}/refund`).send({ note: 'rfnd_1' })).status).toBe(200);
    vi.mocked(svc.changePaymentStatus).mockRejectedValueOnce(new svc.OrderError(409, 'nope'));
    const res = await as('post', `/orders/${ORDER}/refund`).send({ note: 'rfnd_1' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('nope');
  });
  it('rejects requests', async () => {
    expect((await as('post', `/orders/${ORDER}/requests/bad/reject`).send({ note: 'n' })).status).toBe(404);
    expect((await as('post', `/orders/${ORDER}/requests/${REQ}/reject`).send({})).status).toBe(400);
    vi.mocked(svc.rejectRequest).mockResolvedValueOnce({ id: ORDER } as any);
    expect((await as('post', `/orders/${ORDER}/requests/${REQ}/reject`).send({ note: 'n' })).body.message).toBe('Request rejected');
    vi.mocked(svc.rejectRequest).mockRejectedValueOnce(new Error('x'));
    expect((await as('post', `/orders/${ORDER}/requests/${REQ}/reject`).send({ note: 'n' })).status).toBe(500);
  });
  it('summarises customers', async () => {
    expect((await as('get', '/customers/summary?userIds=bad')).body.data).toEqual({});
    mq.mockResolvedValueOnce({ rows: [{ user_id: USER, orders: '2', spent: '50', last_order_at: 'd' }] } as any);
    expect((await as('get', `/customers/summary?userIds=${USER},x`)).body.data[USER]).toEqual({ orders: 2, spent: 50, lastOrderAt: 'd' });
    mq.mockImplementationOnce(boom as any);
    expect((await as('get', `/customers/summary?userIds=${USER}`)).status).toBe(500);
  });
  it('computes KPIs', async () => {
    expect((await as('get', '/kpis?days=5')).status).toBe(400);
    mq.mockImplementation(async (sql: string) => {
      if (sql.includes('generate_series')) return { rows: [{ day: 'd', revenue: '10', orders: '1' }] } as any;
      if (sql.includes('CASE WHEN')) return { rows: [{ status: 'pending', count: '2' }, { status: 'delivered', count: '1' }] } as any;
      if (sql.includes('oi.product_id')) return { rows: [{ product_id: PRODUCT, units: '3', revenue: '30' }, { product_id: 'gone', units: '1', revenue: '1' }] } as any;
      if (sql.includes('FROM order_requests')) return { rows: [{ count: '4' }] } as any;
      if (sql.includes('failed_payments')) return { rows: [{ paid_orders: '4', revenue: '200', orders: '8', failed_payments: '1', customers: '3' }] } as any;
      return { rows: [{ revenue: '100', paid_orders: '2' }] } as any;
    });
    mProducts.mockResolvedValueOnce(new Map([[PRODUCT, { name: 'Shirt', imageUrl: 'i' } as any]]));
    const d = (await as('get', '/kpis?days=7')).body.data;
    expect(d).toMatchObject({ periodDays: 7, revenue: 200, revenueChange: 100, averageOrderValue: 50, conversionRate: 50, pendingRefundRequests: 4 });
    expect(d.pipeline).toMatchObject({ awaitingPayment: 2, delivered: 1, packed: 0 });
    expect(d.topProducts[1]).toMatchObject({ name: 'Unavailable product', imageUrl: '' });
  });
  it('KPIs handle zero periods and product failures', async () => {
    mq.mockImplementation(async (sql: string) => {
      if (sql.includes('failed_payments')) return { rows: [{ paid_orders: '0', revenue: '0', orders: '0', failed_payments: '0', customers: '0' }] } as any;
      if (sql.includes('COUNT(*) AS count FROM order_requests')) return { rows: [{ count: '0' }] } as any;
      if (sql.includes('AND created_at <')) return { rows: [{ revenue: '0', paid_orders: '0' }] } as any;
      return { rows: [] } as any;
    });
    mProducts.mockRejectedValueOnce(new Error('x'));
    const d = (await as('get', '/kpis')).body.data;
    expect(d).toMatchObject({ periodDays: 30, revenueChange: null, averageOrderValue: 0, conversionRate: 0 });
    mq.mockImplementation(boom as any);
    expect((await as('get', '/kpis')).status).toBe(500);
  });
});

describe('customer order routes', () => {
  const body = { items: [{ productId: PRODUCT, quantity: 2 }], shippingAddress: { address: '12 MG Road, Pune' } };
  it('502s when product lookup fails', async () => {
    mProducts.mockRejectedValueOnce(new Error('x'));
    expect((await request(app).post('/').set('Authorization', customer).send(body)).status).toBe(502);
  });
  it('409s missing / out of stock products', async () => {
    mProducts.mockResolvedValueOnce(new Map());
    expect((await request(app).post('/').set('Authorization', customer).send(body)).status).toBe(409);
    mProducts.mockResolvedValueOnce(new Map([[PRODUCT, { id: PRODUCT, name: 'Shirt', price: 1, inventoryQuantity: 0, isActive: true } as any]]));
    const res = await request(app).post('/').set('Authorization', customer).send(body);
    expect(res.body.error).toBe('Shirt is out of stock');
  });
  it('rolls back on insert failure', async () => {
    mProducts.mockResolvedValueOnce(new Map([[PRODUCT, { id: PRODUCT, name: 'S', price: 1, inventoryQuantity: 9, isActive: true } as any]]));
    client.query.mockImplementation(async (sql: string) => { if (sql.startsWith('INSERT INTO orders')) throw new Error('x'); return {}; });
    expect((await request(app).post('/').set('Authorization', customer).send(body)).status).toBe(500);
    expect(client.query.mock.calls.map(c => c[0])).toContain('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
  it('lists my orders with timelines', async () => {
    mq.mockImplementation(async (sql: string) => {
      if (sql.startsWith('SELECT * FROM orders')) return { rows: [row, { ...row, id: 'o2' }] } as any;
      if (sql.includes('FROM order_items')) return { rows: [{ order_id: ORDER, product_id: PRODUCT, quantity: 1, price: '1' }] } as any;
      if (sql.includes('order_events')) return { rows: [{ order_id: ORDER, to_value: 'pending', created_at: 'a' }, { order_id: ORDER, to_value: 'processing', created_at: 'b' }] } as any;
      return { rows: [] } as any;
    });
    const res = await request(app).get('/my-orders').set('Authorization', customer);
    expect(res.body.data[0].timeline).toEqual([{ status: 'pending', at: 'a' }, { status: 'confirmed', at: 'b' }]);
    expect(res.body.data[1]).toMatchObject({ items: [], timeline: [], requests: [] });
  });
  it('lists no orders and handles errors', async () => {
    mq.mockResolvedValueOnce({ rows: [] } as any);
    expect((await request(app).get('/my-orders').set('Authorization', customer)).body.data).toEqual([]);
    mq.mockImplementationOnce(boom as any);
    expect((await request(app).get('/my-orders').set('Authorization', customer)).status).toBe(500);
  });
  it('cancels', async () => {
    const post = (b: any) => request(app).post(`/${ORDER}/cancel`).set('Authorization', customer).send(b);
    expect((await post({})).status).toBe(400);
    vi.mocked(svc.customerCancel).mockResolvedValueOnce({ paymentStatus: 'paid' } as any);
    expect((await post({ reason: 'changed' })).body.message).toContain('refund');
    vi.mocked(svc.customerCancel).mockResolvedValueOnce({ paymentStatus: 'pending' } as any);
    expect((await post({ reason: 'changed', details: 'd' })).body.message).toBe('Order cancelled.');
    expect(svc.customerCancel).toHaveBeenLastCalledWith(ORDER, USER, 'jane@example.com', 'changed', 'd');
    vi.mocked(svc.customerCancel).mockRejectedValueOnce(new svc.OrderError(409, 'no'));
    expect((await post({ reason: 'changed' })).status).toBe(409);
  });
  it('requests returns', async () => {
    const post = (b: any) => request(app).post(`/${ORDER}/return`).set('Authorization', customer).send(b);
    expect((await post({ reason: 'bad' })).status).toBe(400);
    vi.mocked(svc.requestReturn).mockResolvedValueOnce({ id: ORDER } as any);
    expect((await post({ type: 'return', reason: 'damaged' })).status).toBe(201);
    vi.mocked(svc.requestReturn).mockRejectedValueOnce(new Error('x'));
    expect((await post({ type: 'refund', reason: 'damaged' })).status).toBe(500);
  });
  it('legacy status endpoint', async () => {
    vi.mocked(svc.changeOrderStatus).mockResolvedValueOnce({ order: { id: ORDER } as any, refundRequired: false, message: '' });
    expect((await request(app).patch(`/${ORDER}/status`).set('Authorization', admin).send({ status: 'packed' })).body.refundRequired).toBe(false);
    vi.mocked(svc.changeOrderStatus).mockRejectedValueOnce(new svc.OrderError(409, 'no'));
    expect((await request(app).patch(`/${ORDER}/status`).set('Authorization', admin).send({})).status).toBe(409);
  });
  it('payment status endpoint validates and trims', async () => {
    const patch = (b: any) => request(app).patch(`/${ORDER}/payment-status`).set('x-internal-token', INTERNAL).send(b);
    expect((await patch({ paymentStatus: 'free' })).status).toBe(400);
    vi.mocked(svc.changePaymentStatus).mockResolvedValueOnce({ id: ORDER } as any);
    await patch({ paymentStatus: 'refunded', refundId: ' rfnd ', note: '  ', actor: 'bot' });
    expect(svc.changePaymentStatus).toHaveBeenCalledWith(ORDER, 'refunded', 'bot', { paymentId: undefined, refundId: 'rfnd', note: undefined });
    vi.mocked(svc.changePaymentStatus).mockRejectedValueOnce(new Error('x'));
    expect((await patch({ paymentStatus: 'paid' })).status).toBe(500);
  });
});
