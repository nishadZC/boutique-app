import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const client = { query: vi.fn(), release: vi.fn() };
vi.mock('../database/connection', () => ({
  query: vi.fn(),
  getPool: () => ({ connect: async () => client }),
}));
vi.mock('../clients/productClient', () => ({
  getProducts: vi.fn(),
  getProduct: vi.fn(),
  commitStock: vi.fn(async () => ({ shortages: [] })),
}));
vi.mock('../metrics', () => ({
  boutiqueTotalOrders: { inc: vi.fn() },
  boutiqueTotalRevenue: { inc: vi.fn(), dec: vi.fn() },
}));

import { orderRoutes } from './orders';
import { adminRoutes } from './admin';
import { internalRoutes } from './internal';
import { query } from '../database/connection';
import { getProducts } from '../clients/productClient';

process.env.JWT_SECRET = 'test-secret';
process.env.INTERNAL_API_TOKEN = 'internal-test-token';

const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);
app.use('/internal', internalRoutes);
app.use('', orderRoutes);

const mockedQuery = vi.mocked(query);
const mockedGetProducts = vi.mocked(getProducts);
const USER = '11111111-1111-4111-8111-111111111111';
const PRODUCT = '22222222-2222-4222-8222-222222222222';
const ORDER = '33333333-3333-4333-8333-333333333333';
const token = (claims: object) => `Bearer ${jwt.sign(claims, 'test-secret')}`;
const customer = token({ userId: USER, email: 'jane@example.com', role: 'customer' });
const admin = token({ userId: USER, email: 'owner@example.com', role: 'admin' });

beforeEach(() => {
  vi.clearAllMocks();
  client.query.mockReset();
  mockedQuery.mockReset();
});

describe('authentication and authorisation', () => {
  it('rejects anonymous order creation', async () => {
    const res = await request(app).post('/').send({});
    expect(res.status).toBe(401);
  });

  it('rejects a refresh token used as an access token', async () => {
    const res = await request(app).get('/my-orders').set('Authorization', token({ userId: USER, type: 'refresh' }));
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with another secret', async () => {
    const forged = `Bearer ${jwt.sign({ userId: USER, role: 'admin' }, 'your-secret-key')}`;
    const res = await request(app).get('/admin/kpis').set('Authorization', forged);
    expect(res.status).toBe(401);
  });

  it('keeps admin routes away from customers', async () => {
    for (const [method, path] of [['get', '/admin/orders'], ['get', '/admin/kpis'], ['patch', `/admin/orders/${ORDER}/status`]] as const) {
      const res = await request(app)[method](path).set('Authorization', customer).send({ status: 'packed' });
      expect(res.status).toBe(403);
    }
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('no longer lets anyone mark an order paid', async () => {
    // Regression: this endpoint used to be public through the gateway.
    const anonymous = await request(app).patch(`/${ORDER}/payment-status`).send({ paymentStatus: 'paid' });
    const asAdmin = await request(app).patch(`/${ORDER}/payment-status`).set('Authorization', admin).send({ paymentStatus: 'paid' });
    expect(anonymous.status).toBe(403);
    expect(asAdmin.status).toBe(403);
    expect(client.query).not.toHaveBeenCalled();
  });

  it('accepts the internal token for payment updates', async () => {
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: ORDER, status: 'pending', payment_status: 'pending', total_amount: '100', stock_committed: false }] })
      .mockResolvedValueOnce({ rows: [{ id: ORDER, status: 'confirmed', payment_status: 'paid', total_amount: '100', stock_committed: false }] })
      .mockResolvedValue({ rows: [] });
    mockedQuery.mockResolvedValue({ rows: [{ id: ORDER, status: 'confirmed', payment_status: 'paid', total_amount: '100' }] });

    const res = await request(app).patch(`/${ORDER}/payment-status`).set('x-internal-token', 'internal-test-token').send({ paymentStatus: 'paid', paymentId: 'pay_123' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
  });

  it('rejects a wrong internal token', async () => {
    const res = await request(app).get(`/internal/orders/${ORDER}`).set('x-internal-token', 'guess');
    expect(res.status).toBe(403);
  });
});

describe('POST / (create order)', () => {
  const body = { items: [{ productId: PRODUCT, quantity: 2, selectedSize: 'M' }], shippingAddress: { address: '12 MG Road, Pune' } };

  it.each([
    [{ ...body, items: [{ productId: PRODUCT, quantity: -1 }] }],
    [{ ...body, items: [{ productId: PRODUCT, quantity: 11 }] }],
    [{ ...body, items: [{ productId: 'not-a-uuid', quantity: 1 }] }],
    [{ ...body, items: [] }],
    [{ items: body.items, shippingAddress: { address: '' } }],
  ])('rejects invalid input %#', async (payload) => {
    const res = await request(app).post('/').set('Authorization', customer).send(payload);
    expect(res.status).toBe(400);
    expect(mockedGetProducts).not.toHaveBeenCalled();
  });

  it('refuses more than is in stock', async () => {
    mockedGetProducts.mockResolvedValueOnce(new Map([[PRODUCT, { id: PRODUCT, name: 'Oxford Shirt', price: 1500, inventoryQuantity: 1, isActive: true } as any]]));
    const res = await request(app).post('/').set('Authorization', customer).send(body);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Only 1 of Oxford Shirt left in stock');
  });

  it('refuses archived products', async () => {
    mockedGetProducts.mockResolvedValueOnce(new Map([[PRODUCT, { id: PRODUCT, name: 'Old', price: 10, inventoryQuantity: 9, isActive: false } as any]]));
    const res = await request(app).post('/').set('Authorization', customer).send(body);
    expect(res.status).toBe(409);
  });

  it('prices the order from the catalogue, not the request', async () => {
    mockedGetProducts.mockResolvedValueOnce(new Map([[PRODUCT, { id: PRODUCT, name: 'Oxford Shirt', price: 1499.5, inventoryQuantity: 10, isActive: true } as any]]));
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: ORDER, user_id: USER, total_amount: '2999', status: 'pending', payment_status: 'pending' }] })
      .mockResolvedValue({ rows: [] });
    mockedQuery.mockResolvedValue({ rows: [] });

    const res = await request(app).post('/').set('Authorization', customer).send({ ...body, items: [{ ...body.items[0], price: 1 }] });

    expect(res.status).toBe(201);
    const insertOrder = client.query.mock.calls[1];
    // 2 x 1499.50 = 2999 subtotal, free shipping above 500, 8% tax.
    expect(insertOrder[1]).toEqual([USER, 3238.92, 2999, 0, 239.92, JSON.stringify(body.shippingAddress)]);
  });
});

describe('admin status changes', () => {
  it('refuses to skip a fulfilment step', async () => {
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: ORDER, status: 'confirmed', payment_status: 'paid' }] })
      .mockResolvedValue({});

    const res = await request(app).patch(`/admin/orders/${ORDER}/status`).set('Authorization', admin).send({ status: 'shipped' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Next step for this order is "packed"');
  });

  it('rejects unknown statuses before touching the database', async () => {
    const res = await request(app).patch(`/admin/orders/${ORDER}/status`).set('Authorization', admin).send({ status: 'teleported' });
    expect(res.status).toBe(400);
    expect(client.query).not.toHaveBeenCalled();
  });
});

describe('review eligibility', () => {
  it('only allows delivered orders owned by the customer', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ status: 'shipped', user_id: USER, has_item: true }] });
    const res = await request(app)
      .get(`/internal/orders/${ORDER}/review-eligibility`)
      .query({ userId: USER, productId: PRODUCT })
      .set('x-internal-token', 'internal-test-token');
    expect(res.body.data).toEqual({ eligible: false, reason: 'You can review items once your order is delivered' });
  });
});
