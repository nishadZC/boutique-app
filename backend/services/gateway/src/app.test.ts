import http from 'http';
import { AddressInfo } from 'net';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, serviceUrls } from './app';
import { gatewayRouteLabel } from './metrics';

const names = ['AUTH', 'USER', 'PRODUCTS', 'ORDERS', 'PAYMENTS', 'WISHLIST'] as const;
const servers: http.Server[] = [];
let app: express.Express;

function startUpstream(name: string): Promise<string> {
  const up = express();
  up.use((req, res) => {
    res.json({ upstream: name, url: req.url, internal: req.headers['x-internal-token'] ?? null });
  });
  return new Promise(resolve => {
    const s = up.listen(0, '127.0.0.1', () => {
      servers.push(s);
      resolve(`http://127.0.0.1:${(s.address() as AddressInfo).port}`);
    });
  });
}

beforeAll(async () => {
  for (const n of names) process.env[`${n}_SERVICE_URL`] = await startUpstream(n);
  process.env.CORS_ORIGINS = 'http://allowed.test, http://other.test';
  app = createApp();
});
afterAll(() => {
  servers.forEach(s => s.close());
});

describe('serviceUrls', () => {
  it('falls back to localhost defaults', () => {
    const saved = { ...process.env };
    for (const n of names) delete process.env[`${n}_SERVICE_URL`];
    expect(serviceUrls()).toEqual({
      auth: 'http://localhost:3002', users: 'http://localhost:3004', products: 'http://localhost:3003',
      orders: 'http://localhost:3005', payments: 'http://localhost:3006', wishlist: 'http://localhost:3007',
    });
    Object.assign(process.env, saved);
  });
});

describe('gateway app', () => {
  it('health checks', async () => {
    expect((await request(app).get('/')).text).toBe('OK');
    const r = await request(app).get('/api');
    expect(r.status).toBe(200);
    expect(r.text).toBe('OK');
  });

  it('404 for unknown path', async () => {
    const r = await request(app).get('/nope');
    expect(r.status).toBe(404);
    expect(r.body).toEqual({ error: 'Service not found' });
  });

  it('CORS allows listed origins and no-origin requests', async () => {
    const r = await request(app).get('/').set('Origin', 'http://other.test');
    expect(r.headers['access-control-allow-origin']).toBe('http://other.test');
    expect(r.headers['access-control-allow-credentials']).toBe('true');
    expect((await request(app).get('/')).status).toBe(200);
  });

  it('CORS rejects other origins with 500', async () => {
    const err = console.error;
    console.error = () => {};
    const r = await request(app).get('/').set('Origin', 'http://evil.test');
    console.error = err;
    expect(r.status).toBe(500);
    expect(r.body).toEqual({ error: 'Internal server error' });
  });

  it.each([
    ['/api/auth/login?x=1', 'AUTH', '/login?x=1'],
    ['/api/users/me', 'USER', '/me'],
    ['/api/products/abc', 'PRODUCTS', '/abc'],
    ['/api/orders/1', 'ORDERS', '/1'],
    ['/api/payments/intent', 'PAYMENTS', '/intent'],
    ['/api/wishlist/xyz', 'WISHLIST', '/wishlist/xyz'],
    ['/api/wishlist', 'WISHLIST', '/wishlist'],
    ['/api/recommendations', 'PRODUCTS', '/recommendations'],
  ])('proxies %s to %s as %s', async (path, upstream, url) => {
    const r = await request(app).get(path).set('x-internal-token', 'client-supplied');
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ upstream, url, internal: null });
  });

  it('labels metrics by proxy prefix', async () => {
    await request(app).get('/api/orders/42');
    await request(app).get('/zzz');
    const m = (await request(app).get('/metrics')).text;
    expect(m).toMatch(/http_requests_total\{[^}]*route="\/api\/orders"/);
    expect(m).toMatch(/http_requests_total\{[^}]*route="unmatched"/);
    expect(m).not.toMatch(/route="\/api\/orders\/42"/);
  });
});

describe('gatewayRouteLabel', () => {
  it('uses req.route when set', () => {
    expect(gatewayRouteLabel({ route: { path: '/x' }, baseUrl: '/b', originalUrl: '/b/x' })).toBe('/b/x');
  });
  it('matches prefixes exactly or with slash', () => {
    expect(gatewayRouteLabel({ originalUrl: '/api/auth?a=1' })).toBe('/api/auth');
    expect(gatewayRouteLabel({ originalUrl: '/api/wishlist/1' })).toBe('/api/wishlist');
    expect(gatewayRouteLabel({ originalUrl: '/api/authx' })).toBe('unmatched');
  });
});
