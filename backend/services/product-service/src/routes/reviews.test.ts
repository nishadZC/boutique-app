import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

vi.mock('../database/connection', () => ({ query: vi.fn(), getPool: vi.fn() }));
vi.mock('axios', () => ({ default: { get: vi.fn() } }));
import axios from 'axios';
import { reviewRoutes } from './reviews';
import { query } from '../database/connection';

const SECRET = randomBytes(32).toString('hex');
process.env.JWT_SECRET = SECRET;
process.env.INTERNAL_API_TOKEN = randomBytes(24).toString('hex');
const app = express();
app.use(express.json());
app.use('/reviews', reviewRoutes);
const q = vi.mocked(query);
const get = vi.mocked(axios.get);
const P = '22222222-2222-4222-8222-222222222222';
const O = '33333333-3333-4333-8333-333333333333';
const user = `Bearer ${jwt.sign({ userId: 'u1', role: 'customer' }, SECRET)}`;
const body = { productId: P, orderId: O, rating: 5, title: 'Great', comment: 'Nice' };
const reviewRow = { id: 'r', product_id: P, rating: 5, title: null, comment: null, reviewer_name: null, created_at: 'd' };

beforeEach(() => { q.mockReset(); get.mockReset(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

describe('GET /reviews/product/:id', () => {
  it('404 bad id', async () => expect((await request(app).get('/reviews/product/x')).status).toBe(404));
  it('lists with summary', async () => {
    q.mockResolvedValueOnce({ rows: [reviewRow] })
      .mockResolvedValueOnce({ rows: [{ count: '2', average: '4.333', r5: '1', r4: '1', r3: '0', r2: '0', r1: '0' }] });
    const res = await request(app).get(`/reviews/product/${P}`).query({ limit: '999' });
    expect(q.mock.calls[0][1]).toEqual([P, 50]);
    expect(res.body.data.reviews[0]).toEqual({ id: 'r', productId: P, rating: 5, title: '', comment: '', reviewerName: 'Verified buyer', createdAt: 'd' });
    expect(res.body.data.summary).toEqual({ count: 2, average: 4.3, distribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 } });
  });
  it('default limit on garbage', async () => {
    q.mockResolvedValue({ rows: [{ count: '0', average: '0' }] });
    await request(app).get(`/reviews/product/${P}`).query({ limit: 'x' });
    expect(q.mock.calls[0][1]).toEqual([P, 10]);
  });
  it('500', async () => {
    q.mockRejectedValue(new Error('x'));
    expect((await request(app).get(`/reviews/product/${P}`)).status).toBe(500);
  });
});

describe('GET /reviews/mine', () => {
  it('401 without login', async () => expect((await request(app).get('/reviews/mine')).status).toBe(401));
  it('400 on malformed orderId', async () => expect((await request(app).get('/reviews/mine').query({ orderId: 'x' }).set('Authorization', user)).status).toBe(400));
  it('BUG: missing orderId is not rejected (Joi guid() is not required) and reaches the DB', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/reviews/mine').set('Authorization', user);
    expect(res.status).toBe(200);
    expect(q.mock.calls[0][1]).toEqual(['u1', undefined]);
  });
  it('200', async () => {
    q.mockResolvedValue({ rows: [{ product_id: P, rating: 4 }] });
    const res = await request(app).get('/reviews/mine').query({ orderId: O }).set('Authorization', user);
    expect(res.body.data).toEqual([{ productId: P, rating: 4 }]);
    expect(q.mock.calls[0][1]).toEqual(['u1', O]);
  });
  it('500', async () => {
    q.mockRejectedValue(new Error('x'));
    expect((await request(app).get('/reviews/mine').query({ orderId: O }).set('Authorization', user)).status).toBe(500);
  });
});

describe('POST /reviews', () => {
  const post = (b: object) => request(app).post('/reviews').set('Authorization', user).send(b);
  it('400 validation', async () => {
    const res = await post({ rating: 9 });
    expect(res.status).toBe(400);
    expect(res.body.error).not.toMatch(/"/);
  });
  it('403 not eligible with reason', async () => {
    get.mockResolvedValueOnce({ data: { data: { eligible: false, reason: 'Not delivered' } } });
    const res = await post(body);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Not delivered');
  });
  it('403 default reason', async () => {
    get.mockResolvedValueOnce({ data: {} });
    expect((await post(body)).body.error).toMatch(/delivered/);
  });
  it('201 with display name', async () => {
    get.mockResolvedValueOnce({ data: { data: { eligible: true } } }).mockResolvedValueOnce({ data: { data: { displayName: 'Ann' } } });
    q.mockResolvedValue({ rows: [{ ...reviewRow, reviewer_name: 'Ann', title: 'Great' }] });
    const res = await post(body);
    expect(res.status).toBe(201);
    expect(res.body.data.reviewerName).toBe('Ann');
    expect(q.mock.calls[0][1]).toEqual([P, 'u1', O, 5, 'Great', 'Nice', 'Ann']);
  });
  it('201 even if user-service fails', async () => {
    get.mockResolvedValueOnce({ data: { data: { eligible: true } } }).mockRejectedValueOnce(new Error('down'));
    q.mockResolvedValue({ rows: [reviewRow] });
    const res = await post({ productId: P, orderId: O, rating: 3 });
    expect(res.status).toBe(201);
    expect(q.mock.calls[0][1]).toEqual([P, 'u1', O, 3, '', '', 'Verified buyer']);
  });
  it('409 duplicate', async () => {
    get.mockResolvedValueOnce({ data: { data: { eligible: true } } }).mockResolvedValueOnce({ data: {} });
    q.mockResolvedValue({ rows: [] });
    expect((await post(body)).status).toBe(409);
  });
  it('404 order not found', async () => {
    get.mockRejectedValueOnce({ response: { status: 404 } });
    expect((await post(body)).status).toBe(404);
  });
  it('502 other failure', async () => {
    get.mockRejectedValueOnce(new Error('timeout'));
    expect((await post(body)).status).toBe(502);
  });
});
