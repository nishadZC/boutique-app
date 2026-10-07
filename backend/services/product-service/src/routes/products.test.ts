import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../database/connection', () => ({ query: vi.fn(), getPool: vi.fn() }));
import { productRoutes } from './products';
import { query } from '../database/connection';

const app = express();
app.use('', productRoutes);
const q = vi.mocked(query);
const ID = '22222222-2222-4222-8222-222222222222';

beforeEach(() => { q.mockReset(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

describe('GET /', () => {
  it('builds filters, pagination and default image', async () => {
    q.mockResolvedValueOnce({ rows: [{ total: '30' }] }).mockResolvedValueOnce({ rows: [{ id: 1, image_url: '' }, { id: 2, image_url: 'x' }] });
    const res = await request(app).get('/').query({ category: 'Shirts', search: 'lin', minPrice: '1', maxPrice: '9', page: '2', limit: '10', sortBy: 'price', sortOrder: 'DESC' });
    expect(res.body.data.pagination).toEqual({ currentPage: 2, totalPages: 3, total: 30, hasNext: true, hasPrev: true });
    expect(res.body.data.products[0].image_url).toMatch(/^https:/);
    expect(res.body.data.products[1].image_url).toBe('x');
    expect(q.mock.calls[0][1]).toEqual(['Shirts', '%lin%', '%lin%', '1', '9']);
    expect(q.mock.calls[1][0]).toMatch(/ORDER BY p.price DESC, p.id\s+LIMIT \$6 OFFSET \$7/);
    expect(q.mock.calls[1][1]).toEqual(['Shirts', '%lin%', '%lin%', '1', '9', 10, 10]);
  });
  it('falls back on non-numeric page', async () => {
    q.mockResolvedValueOnce({ rows: [{ total: '0' }] }).mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/').query({ page: 'abc', limit: 'x' });
    expect(res.body.data.pagination).toMatchObject({ currentPage: 1, hasPrev: false, hasNext: false });
  });
  it('500', async () => {
    q.mockRejectedValue(new Error('x'));
    expect((await request(app).get('/')).status).toBe(500);
  });
});

describe('GET /by-skin-tone/:group', () => {
  it('groups by category', async () => {
    q.mockResolvedValue({ rows: [{ category: 'Formal Shirts' }, { category: 'Trousers & Pants' }, { category: 'Formal Shoes' }, { category: 'Other' }] });
    const res = await request(app).get('/by-skin-tone/deep').query({ limit: '500' });
    expect(q.mock.calls[0][1]).toEqual(['deep', 100]);
    expect(res.body.data.all).toHaveLength(4);
    expect(res.body.data.byCategory.shirts).toHaveLength(1);
    expect(res.body.data.byCategory.trousers).toHaveLength(1);
    expect(res.body.data.byCategory.shoes).toHaveLength(1);
  });
  it('500', async () => {
    q.mockRejectedValue(new Error('x'));
    expect((await request(app).get('/by-skin-tone/deep')).status).toBe(500);
  });
});

describe('GET /categories & /:id', () => {
  it('categories 500', async () => {
    q.mockRejectedValue(new Error('x'));
    expect((await request(app).get('/categories')).status).toBe(500);
  });
  it('product 404 when no rows', async () => {
    q.mockResolvedValue({ rows: [] });
    expect((await request(app).get(`/${ID}`)).status).toBe(404);
  });
  it('active product 200 with default image', async () => {
    q.mockResolvedValue({ rows: [{ id: ID, is_active: true, image_url: null }] });
    const res = await request(app).get(`/${ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.image_url).toMatch(/^https:/);
  });
  it('product 500', async () => {
    q.mockRejectedValue(new Error('x'));
    expect((await request(app).get(`/${ID}`)).status).toBe(500);
  });
});
