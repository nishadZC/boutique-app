import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'crypto';

vi.mock('./database/connection', () => ({ query: vi.fn(), getPool: vi.fn() }));
vi.mock('./metrics', () => ({
  setupMetrics: vi.fn(),
  metricsMiddleware: (_req: any, _res: any, next: any) => next(),
}));

import { createApp } from './app';
import { setupMetrics } from './metrics';

process.env.JWT_SECRET = randomBytes(32).toString('hex');

describe('createApp', () => {
  it('wires metrics and routers', async () => {
    const app = createApp();
    expect(setupMetrics).toHaveBeenCalledWith(app, { serviceName: 'orders', serviceVersion: '1.0.0' });
    expect((await request(app).get('/my-orders')).status).toBe(401);
    expect((await request(app).get('/admin/kpis')).status).toBe(401);
  });
  it('returns 500 from the error handler', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(createApp()).post('/').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});
