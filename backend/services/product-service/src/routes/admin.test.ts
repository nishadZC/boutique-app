import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const client = { query: vi.fn(), release: vi.fn() };
vi.mock('../database/connection', () => ({ query: vi.fn(), getPool: () => ({ connect: async () => client }) }));
vi.mock('../services/imageService', () => ({ uploadProductImage: vi.fn() }));

import { adminRoutes } from './admin';
import { query } from '../database/connection';
import { uploadProductImage } from '../services/imageService';

const SECRET = randomBytes(32).toString('hex');
process.env.JWT_SECRET = SECRET;
const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);

const q = vi.mocked(query);
const up = vi.mocked(uploadProductImage);
const ID = '22222222-2222-4222-8222-222222222222';
const CAT = '20000000-0000-4000-8000-000000000001';
const admin = `Bearer ${jwt.sign({ userId: 'a', email: 'owner@example.com', role: 'admin' }, SECRET)}`;
const adminNoEmail = `Bearer ${jwt.sign({ userId: 'a2', role: 'admin' }, SECRET)}`;
const row = { id: ID, name: 'Shirt', price: '10', compare_price: '20', is_active: true, category_id: CAT, category: 'Shirts' };
const bare = { id: ID, name: 'Shirt', price: '10', compare_price: null };
const boom = () => Promise.reject(new Error('db down'));

beforeEach(() => {
  q.mockReset(); client.query.mockReset(); client.release.mockReset(); up.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const A = (r: request.Test, auth = admin) => r.set('Authorization', auth);

describe('admin categories', () => {
  it('lists categories', async () => {
    q.mockResolvedValue({ rows: [{ id: CAT, name: 'Shirts', product_count: '3' }] });
    const res = await A(request(app).get('/admin/categories'));
    expect(res.body.data).toEqual([{ id: CAT, name: 'Shirts', productCount: 3 }]);
  });
  it('500 on error', async () => {
    q.mockImplementation(boom);
    expect((await A(request(app).get('/admin/categories'))).status).toBe(500);
  });
});

describe('admin list products', () => {
  it('applies all filters', async () => {
    q.mockResolvedValueOnce({ rows: [row, bare] }).mockResolvedValueOnce({ rows: [{ total: '2' }] });
    const res = await A(request(app).get('/admin/products').query({ status: 'active', stock: 'low', categoryId: CAT, search: ' linen ', page: '2', limit: '500' }));
    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toEqual({ page: 2, limit: 100, total: 2, totalPages: 1 });
    expect(res.body.data.products[1]).toMatchObject({ comparePrice: null, sku: '', isActive: false, skinToneTags: [] });
    expect(res.body.data.products[0].comparePrice).toBe(20);
    expect(q.mock.calls[1][0]).toMatch(/p.is_active = true AND p.inventory_quantity BETWEEN 1 AND \$1 AND p.category_id = \$2 AND \(p.name ILIKE \$3/);
    expect(q.mock.calls[1][1]).toEqual([5, CAT, '%linen%']);
  });
  it('archived/out filters and defaults', async () => {
    q.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ total: '0' }] });
    const res = await A(request(app).get('/admin/products').query({ status: 'archived', stock: 'out', categoryId: 'bad', page: 'x' }));
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 25 });
    expect(q.mock.calls[1][0]).toMatch(/p.is_active = false AND p.inventory_quantity = 0$/);
  });
  it('500 on error', async () => {
    q.mockImplementation(boom);
    expect((await A(request(app).get('/admin/products'))).status).toBe(500);
  });
});

describe('admin get product', () => {
  it('404 bad id', async () => expect((await A(request(app).get('/admin/products/x'))).status).toBe(404));
  it('404 missing', async () => {
    q.mockResolvedValue({ rows: [] });
    expect((await A(request(app).get(`/admin/products/${ID}`))).status).toBe(404);
  });
  it('200', async () => {
    q.mockResolvedValue({ rows: [row] });
    const res = await A(request(app).get(`/admin/products/${ID}`));
    expect(res.body.data).toMatchObject({ id: ID, price: 10, isActive: true });
  });
  it('500', async () => {
    q.mockImplementation(boom);
    expect((await A(request(app).get(`/admin/products/${ID}`))).status).toBe(500);
  });
});

describe('admin create product', () => {
  const valid = { name: 'Linen Shirt', categoryId: CAT, price: 1999 };
  it('400 unknown category', async () => {
    q.mockResolvedValueOnce({ rows: [] });
    const res = await A(request(app).post('/admin/products').send(valid));
    expect(res.body.error).toBe('Unknown category');
  });
  it('409 sku taken', async () => {
    q.mockResolvedValueOnce({ rows: [{}] }).mockResolvedValueOnce({ rows: [{}] });
    expect((await A(request(app).post('/admin/products').send({ ...valid, sku: 'S1' }))).status).toBe(409);
  });
  it('creates with image and initial stock', async () => {
    q.mockResolvedValueOnce({ rows: [{}] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [row] });
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [{ id: ID }] }).mockResolvedValue({});
    const res = await A(request(app).post('/admin/products').send({ ...valid, sku: 'S1', imageUrl: 'https://x.example.com/a.jpg', inventoryQuantity: 4, madeToMeasure: true, makingDays: 5 }), adminNoEmail);
    expect(res.status).toBe(201);
    const sqls = client.query.mock.calls.map(c => String(c[0]));
    expect(sqls.some(s => s.includes('product_images'))).toBe(true);
    const adj = client.query.mock.calls.find(c => String(c[0]).includes('inventory_adjustments'));
    expect(adj?.[1]).toEqual([ID, 4, 'a2']);
    expect(client.release).toHaveBeenCalled();
  });
  it('creates minimal product (no sku lookup)', async () => {
    q.mockResolvedValueOnce({ rows: [{}] }).mockResolvedValueOnce({ rows: [row] });
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [{ id: ID }] }).mockResolvedValue({});
    expect((await A(request(app).post('/admin/products').send(valid))).status).toBe(201);
    expect(client.query).toHaveBeenCalledTimes(3);
  });
  it('rolls back on error', async () => {
    q.mockResolvedValueOnce({ rows: [{}] });
    client.query.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('x')).mockResolvedValue({});
    const res = await A(request(app).post('/admin/products').send(valid));
    expect(res.status).toBe(500);
    expect(client.query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  });
});

describe('admin update product', () => {
  const cur = { rows: [{ price: '100', compare_price: null, made_to_measure: false, making_days: null }] };
  const put = (body: object, id = ID) => A(request(app).put(`/admin/products/${id}`).send(body));
  it('404 bad id', async () => expect((await put({ name: 'ab' }, 'nope')).status).toBe(404));
  it('400 empty body', async () => expect((await put({})).status).toBe(400));
  it('404 missing', async () => {
    q.mockResolvedValueOnce({ rows: [] });
    expect((await put({ name: 'abc' })).status).toBe(404);
  });
  it('400 compare price', async () => {
    q.mockResolvedValueOnce(cur);
    expect((await put({ comparePrice: 50 })).body.error).toMatch(/comparePrice/);
  });
  it('400 compare price from existing row', async () => {
    q.mockResolvedValueOnce({ rows: [{ ...cur.rows[0], compare_price: '120' }] });
    expect((await put({ price: 150 })).status).toBe(400);
  });
  it('400 unknown category', async () => {
    q.mockResolvedValueOnce(cur).mockResolvedValueOnce({ rows: [] });
    expect((await put({ categoryId: CAT })).body.error).toBe('Unknown category');
  });
  it('409 sku', async () => {
    q.mockResolvedValueOnce(cur).mockResolvedValueOnce({ rows: [{}] });
    expect((await put({ sku: 'X' })).status).toBe(409);
  });
  it('updates fields and inserts image when none', async () => {
    q.mockResolvedValueOnce(cur).mockResolvedValueOnce({ rows: [{}] }).mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({}).mockResolvedValueOnce({ rowCount: 0 }).mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [row] });
    const res = await put({ name: 'New name', categoryId: CAT, sku: 'X', comparePrice: 200, madeToMeasure: true, makingDays: 3, imageUrl: 'https://x.example.com/b.jpg' });
    expect(res.status).toBe(200);
    const upd = q.mock.calls[3];
    expect(upd[0]).toMatch(/UPDATE products SET name = \$1, sku = \$2, category_id = \$3/);
    expect(q.mock.calls[5][0]).toMatch(/INSERT INTO product_images/);
  });
  it('image only, existing image updated', async () => {
    q.mockResolvedValueOnce(cur).mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rows: [row] });
    expect((await put({ imageUrl: 'https://x.example.com/b.jpg' })).status).toBe(200);
    expect(q).toHaveBeenCalledTimes(3);
  });
  it('500', async () => {
    q.mockImplementation(boom);
    expect((await put({ name: 'abc' })).status).toBe(500);
  });
});

describe('admin status', () => {
  const patch = (body: object, id = ID) => A(request(app).patch(`/admin/products/${id}/status`).send(body));
  it('404 bad id', async () => expect((await patch({ isActive: true }, 'x')).status).toBe(404));
  it('400 not boolean', async () => expect((await patch({ isActive: 'yes' })).status).toBe(400));
  it('404 missing', async () => {
    q.mockResolvedValueOnce({ rowCount: 0 });
    expect((await patch({ isActive: false })).status).toBe(404);
  });
  it('200', async () => {
    q.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rows: [row] });
    expect((await patch({ isActive: false })).status).toBe(200);
  });
  it('500', async () => {
    q.mockImplementation(boom);
    expect((await patch({ isActive: true })).status).toBe(500);
  });
});

describe('admin image upload', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  const post = (id = ID) => A(request(app).post(`/admin/products/${id}/image`));
  it('404 bad id', async () => expect((await post('x').attach('image', png, { filename: 'a.png', contentType: 'image/png' })).status).toBe(404));
  it('400 no file', async () => expect((await post()).status).toBe(400));
  it('400 wrong type is filtered out', async () => {
    expect((await post().attach('image', png, { filename: 'a.gif', contentType: 'image/gif' })).body.error).toMatch(/JPEG/);
  });
  it('400 too large', async () => {
    const res = await post().attach('image', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'a.png', contentType: 'image/png' });
    expect(res.body.error).toBe('Image must be 5 MB or smaller');
  });
  it('400 invalid upload (unexpected field)', async () => {
    const res = await post().attach('other', png, { filename: 'a.png', contentType: 'image/png' });
    expect(res.body.error).toBe('Invalid image upload');
  });
  it('404 product missing', async () => {
    q.mockResolvedValueOnce({ rows: [] });
    expect((await post().attach('image', png, { filename: 'a.png', contentType: 'image/png' })).status).toBe(404);
  });
  it('201 inserts new image', async () => {
    q.mockResolvedValueOnce({ rows: [{}] }).mockResolvedValueOnce({ rowCount: 0 }).mockResolvedValue({});
    up.mockResolvedValue('https://cdn.example.com/i.png');
    const res = await post().attach('image', png, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.data.imageUrl).toBe('https://cdn.example.com/i.png');
    expect(q).toHaveBeenCalledTimes(4);
  });
  it('201 updates existing image', async () => {
    q.mockResolvedValueOnce({ rows: [{}] }).mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValue({});
    up.mockResolvedValue('u');
    expect((await post().attach('image', png, { filename: 'a.png', contentType: 'image/png' })).status).toBe(201);
    expect(q).toHaveBeenCalledTimes(3);
  });
  it('502 on upload failure', async () => {
    q.mockResolvedValueOnce({ rows: [{}] });
    up.mockRejectedValue(new Error('cloud'));
    expect((await post().attach('image', png, { filename: 'a.png', contentType: 'image/png' })).status).toBe(502);
  });
});

describe('admin inventory', () => {
  const post = (body: object, id = ID) => A(request(app).post(`/admin/products/${id}/inventory`).send(body));
  it('404 bad id', async () => expect((await post({}, 'x')).status).toBe(404));
  it('400 validation', async () => expect((await post({ mode: 'bogus' })).status).toBe(400));
  it('400 negative set', async () => expect((await post({ mode: 'set', quantity: -1, reason: 'other' })).body.error).toBe('Stock cannot be negative'));
  it('404 missing', async () => {
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [] }).mockResolvedValue({});
    expect((await post({ mode: 'set', quantity: 1, reason: 'other' })).status).toBe(404);
  });
  it('400 same level', async () => {
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [{ inventory_quantity: null }] }).mockResolvedValue({});
    expect((await post({ mode: 'set', quantity: 0, reason: 'other' })).body.error).toBe('Stock is already at that level');
  });
  it('set mode success', async () => {
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [{ inventory_quantity: 2 }] }).mockResolvedValue({});
    const res = await post({ mode: 'set', quantity: 7, reason: 'correction' });
    expect(res.body.data).toMatchObject({ previousQuantity: 2, inventoryQuantity: 7 });
  });
  it('500 rolls back', async () => {
    client.query.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('x')).mockResolvedValue({});
    expect((await post({ mode: 'set', quantity: 7, reason: 'correction' })).status).toBe(500);
  });
});

describe('admin inventory history & summary', () => {
  it('404 bad id', async () => expect((await A(request(app).get('/admin/products/x/inventory-history'))).status).toBe(404));
  it('history', async () => {
    q.mockResolvedValue({ rows: [{ id: 1, delta: 2, resulting_quantity: 3, reason: 'restock', note: null, actor: null, order_id: null, created_at: 'd' }] });
    const res = await A(request(app).get(`/admin/products/${ID}/inventory-history`));
    expect(res.body.data[0]).toEqual({ id: 1, delta: 2, resultingQuantity: 3, reason: 'restock', note: '', actor: '', orderId: null, createdAt: 'd' });
  });
  it('history 500', async () => {
    q.mockImplementation(boom);
    expect((await A(request(app).get(`/admin/products/${ID}/inventory-history`))).status).toBe(500);
  });
  it('summary', async () => {
    q.mockResolvedValueOnce({ rows: [{ active: '4', archived: '1', out_of_stock: '1', low_stock: '2', units: '30', retail_value: '300.5' }] })
      .mockResolvedValueOnce({ rows: [row] });
    const res = await A(request(app).get('/admin/inventory/summary'));
    expect(res.body.data).toMatchObject({ activeProducts: 4, archivedProducts: 1, outOfStock: 1, lowStock: 2, unitsInStock: 30, retailValue: 300.5, lowStockThreshold: 5 });
    expect(res.body.data.lowStockProducts).toHaveLength(1);
  });
  it('summary 500', async () => {
    q.mockImplementation(boom);
    expect((await A(request(app).get('/admin/inventory/summary'))).status).toBe(500);
  });
});
