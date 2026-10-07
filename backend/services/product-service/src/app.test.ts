import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('./database/connection', () => ({ query: vi.fn(), getPool: vi.fn(), connectDB: vi.fn() }));
vi.mock('./services/imageService', () => ({ uploadProductImage: vi.fn() }));
import { createApp } from './app';
import { query } from './database/connection';

const q = vi.mocked(query);
beforeEach(() => { q.mockReset(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

describe('createApp', () => {
  const app = createApp();
  it('mounts the public product routes', async () => {
    q.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/categories');
    expect(res.status).toBe(200);
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
  });
  it('mounts admin, internal, reviews and recommendations before /:id', async () => {
    expect((await request(app).get('/admin/products')).status).toBe(401);
    expect((await request(app).post('/internal/inventory/commit')).status).toBe(403);
    expect((await request(app).get('/reviews/mine')).status).toBe(401);
    expect((await request(app).post('/recommendations')).status).toBe(400);
  });
  it('turns unhandled errors into 500', async () => {
    const res = await request(app).post('/admin/products').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
  it('exposes metrics', async () => {
    expect((await request(app).get('/metrics')).status).toBe(200);
  });
});
