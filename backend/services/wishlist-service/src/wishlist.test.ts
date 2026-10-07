import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const query = vi.hoisted(() => vi.fn());
vi.mock('./database/connection', () => ({ pool: { query } }));

process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
const { createApp } = await import('./app');
const app = createApp();
const secret = () => process.env.JWT_SECRET as string;
const token = (p: object = { userId: 'u1' }) => `Bearer ${jwt.sign(p, secret(), { algorithm: 'HS256' })}`;
const pid = '123e4567-e89b-12d3-a456-426614174000';

beforeEach(() => {
  query.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('wishlist service', () => {
  it('health and metrics', async () => {
    expect((await request(app).get('/health')).text).toBe('OK');
    const m = await request(app).get('/metrics');
    expect(m.status).toBe(200);
  });

  it.each(['get', 'post', 'delete'] as const)('%s requires auth', async method => {
    const path = method === 'get' ? '/wishlist' : `/wishlist/${pid}`;
    expect((await request(app)[method](path)).status).toBe(401);
    expect((await request(app)[method](path).set('Authorization', 'Bearer junk')).status).toBe(401);
    expect((await request(app)[method](path).set('Authorization', token({ userId: 'u1', type: 'refresh' }))).status).toBe(401);
    const wrong = `Bearer ${jwt.sign({ userId: 'u1' }, crypto.randomBytes(32).toString('hex'))}`;
    expect((await request(app)[method](path).set('Authorization', wrong)).status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  it('GET returns rows', async () => {
    query.mockResolvedValue({ rows: [{ product_id: pid }] });
    const r = await request(app).get('/wishlist').set('Authorization', token());
    expect(r.body).toEqual({ success: true, data: [{ product_id: pid }] });
    expect(query.mock.calls[0][1]).toEqual(['u1']);
  });

  it('GET db error -> 500', async () => {
    query.mockRejectedValue(new Error('db'));
    const r = await request(app).get('/wishlist').set('Authorization', token());
    expect(r.status).toBe(500);
    expect(r.body.error).toBe('Failed to get wishlist');
  });

  it('POST validates product id', async () => {
    const r = await request(app).post('/wishlist/not-a-uuid').set('Authorization', token());
    expect(r.status).toBe(400);
  });

  it('POST 201 on insert, 200 when exists', async () => {
    query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });
    const a = await request(app).post(`/wishlist/${pid}`).set('Authorization', token());
    expect(a.status).toBe(201);
    expect(a.body).toEqual({ success: true, productId: pid });
    expect(query.mock.calls[0][1]).toEqual(['u1', pid]);
    expect((await request(app).post(`/wishlist/${pid}`).set('Authorization', token())).status).toBe(200);
  });

  it('POST db error -> 500', async () => {
    query.mockRejectedValue(new Error('db'));
    const r = await request(app).post(`/wishlist/${pid}`).set('Authorization', token());
    expect(r.status).toBe(500);
    expect(r.body.error).toBe('Failed to add item to wishlist');
  });

  it('DELETE works, validates, and handles errors', async () => {
    query.mockResolvedValueOnce({ rowCount: 1 });
    const ok = await request(app).delete(`/wishlist/${pid}`).set('Authorization', token());
    expect(ok.body).toEqual({ success: true, productId: pid });
    expect(query.mock.calls[0][1]).toEqual(['u1', pid]);
    expect((await request(app).delete('/wishlist/bad').set('Authorization', token())).status).toBe(400);
    query.mockRejectedValueOnce(new Error('db'));
    const e = await request(app).delete(`/wishlist/${pid}`).set('Authorization', token());
    expect(e.status).toBe(500);
    expect(e.body.error).toBe('Failed to remove item from wishlist');
  });
});
