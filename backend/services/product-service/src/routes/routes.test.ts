import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const client = { query: vi.fn(), release: vi.fn() };
vi.mock('../database/connection', () => ({ query: vi.fn(), getPool: () => ({ connect: async () => client }) }));
vi.mock('../services/imageService', () => ({ uploadProductImage: vi.fn() }));

import { productRoutes } from './products';
import { adminRoutes } from './admin';
import { internalRoutes } from './internal';
import { query } from '../database/connection';

process.env.JWT_SECRET = 'test-secret';
process.env.INTERNAL_API_TOKEN = 'internal-test-token';
const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);
app.use('/internal', internalRoutes);
app.use('', productRoutes);

const mockedQuery = vi.mocked(query);
const PRODUCT = '22222222-2222-4222-8222-222222222222';
const CATEGORY = '20000000-0000-4000-8000-000000000001';
const bearer = (claims: object) => `Bearer ${jwt.sign(claims, 'test-secret')}`;
const admin = bearer({ userId: 'a', email: 'owner@example.com', role: 'admin' });
const customer = bearer({ userId: 'c', role: 'customer' });

beforeEach(() => {
  mockedQuery.mockReset();
  client.query.mockReset();
});

describe('public catalogue', () => {
  it('never interpolates sortBy into SQL', async () => {
    // Regression: `ORDER BY p.${sortBy}` allowed SQL injection.
    mockedQuery.mockResolvedValue({ rows: [{ total: '0' }] });
    await request(app).get('/').query({ sortBy: 'created_at; DROP TABLE products; --' });
    const sql = mockedQuery.mock.calls.map(c => c[0] as string).join('\n');
    expect(sql).not.toMatch(/DROP TABLE/);
    expect(sql).toMatch(/ORDER BY p\.created_at ASC, p\.id/);
  });

  it('hides archived products from shoppers', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: PRODUCT, is_active: false }] });
    expect((await request(app).get(`/${PRODUCT}`)).status).toBe(404);
  });

  it('still resolves archived products for other services', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: PRODUCT, is_active: false, image_url: 'x' }] });
    const res = await request(app).get(`/${PRODUCT}`).set('x-internal-token', 'internal-test-token');
    expect(res.status).toBe(200);
  });

  it('filters the handcrafted collection', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ total: '0' }] });
    await request(app).get('/').query({ handcrafted: 'true' });
    expect(mockedQuery.mock.calls[0][0]).toMatch(/p\.is_handcrafted = true/);
  });

  it('refuses to make a product made-to-measure without a making time', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ price: '1999', compare_price: null, made_to_measure: false, making_days: null }] });
    const res = await request(app).put(`/admin/products/${PRODUCT}`).set('Authorization', admin).send({ madeToMeasure: true });
    expect(res.status).toBe(400);
    expect(mockedQuery).toHaveBeenCalledTimes(1);
  });

  it('returns 404 for malformed ids without querying', async () => {
    expect((await request(app).get('/not-a-uuid')).status).toBe(404);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('reaches /categories (it used to be shadowed by /:id)', async () => {
    mockedQuery.mockResolvedValue({ rows: [] });
    expect((await request(app).get('/categories')).status).toBe(200);
  });
});

describe('admin access', () => {
  it.each([
    ['get', '/admin/products'],
    ['post', '/admin/products'],
    ['put', `/admin/products/${PRODUCT}`],
    ['post', `/admin/products/${PRODUCT}/inventory`],
    ['post', `/admin/products/${PRODUCT}/image`],
    ['get', '/admin/inventory/summary'],
  ] as const)('%s %s is admin-only', async (method, path) => {
    expect((await request(app)[method](path)).status).toBe(401);
    expect((await request(app)[method](path).set('Authorization', customer)).status).toBe(403);
    expect(mockedQuery).not.toHaveBeenCalled();
  });
});

describe('admin product validation', () => {
  const valid = { name: 'Linen Shirt', categoryId: CATEGORY, price: 1999 };

  it.each([
    [{ ...valid, price: -5 }],
    [{ ...valid, price: 0 }],
    [{ ...valid, name: 'x' }],
    [{ ...valid, categoryId: 'shirts' }],
    [{ ...valid, comparePrice: 1500 }],   // "was" price below the price
    [{ ...valid, inventoryQuantity: -1 }],
    [{ ...valid, imageUrl: 'http://insecure.example.com/a.jpg' }],
    [{ ...valid, madeToMeasure: true }],             // made to measure needs a making time
    [{ ...valid, madeToMeasure: true, makingDays: 0 }],
  ])('rejects invalid product %#', async (body) => {
    const res = await request(app).post('/admin/products').set('Authorization', admin).send(body);
    expect(res.status).toBe(400);
    expect(mockedQuery).not.toHaveBeenCalled();
  });
});

describe('admin inventory', () => {
  it('refuses to take stock below zero', async () => {
    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ inventory_quantity: 3 }] })
      .mockResolvedValue({});
    const res = await request(app).post(`/admin/products/${PRODUCT}/inventory`).set('Authorization', admin)
      .send({ mode: 'adjust', quantity: -5, reason: 'damaged' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Only 3 in stock; cannot remove 5');
  });

  it('records who changed stock and why', async () => {
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ inventory_quantity: 3 }] })
      .mockResolvedValue({});
    const res = await request(app).post(`/admin/products/${PRODUCT}/inventory`).set('Authorization', admin)
      .send({ mode: 'adjust', quantity: 10, reason: 'restock', note: 'PO-114' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ previousQuantity: 3, inventoryQuantity: 13 });
    const audit = client.query.mock.calls.find(c => String(c[0]).includes('INSERT INTO inventory_adjustments'));
    expect(audit?.[1]).toEqual([PRODUCT, 10, 13, 'restock', 'PO-114', 'owner@example.com']);
  });
});

describe('internal stock commit', () => {
  it('requires the internal token', async () => {
    const res = await request(app).post('/internal/inventory/commit').set('Authorization', admin).send({});
    expect(res.status).toBe(403);
  });

  it('reports a shortfall instead of going negative', async () => {
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ inventory_quantity: 1 }] })
      .mockResolvedValue({});
    const res = await request(app).post('/internal/inventory/commit').set('x-internal-token', 'internal-test-token')
      .send({ orderId: '33333333-3333-4333-8333-333333333333', direction: 'sale', items: [{ productId: PRODUCT, quantity: 2 }] });
    expect(res.body.data.shortages).toEqual([{ productId: PRODUCT, requested: 2, available: 1 }]);
    const update = client.query.mock.calls.find(c => String(c[0]).startsWith('UPDATE products'));
    expect(update?.[1]).toEqual([0, PRODUCT]);
  });
});
