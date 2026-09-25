import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('./db', () => ({ query: vi.fn(), pool: {} }));
vi.mock('./metrics', () => ({ setupMetrics: vi.fn(), metricsMiddleware: (_q: unknown, _s: unknown, next: () => void) => next() }));

import { createApp } from './app';
import { query } from './db';

process.env.JWT_SECRET = 'test-secret';
process.env.INTERNAL_API_TOKEN = 'internal-test-token';
const app = createApp();
const mockedQuery = vi.mocked(query);
const USER = '11111111-1111-4111-8111-111111111111';
const bearer = (claims: object) => `Bearer ${jwt.sign(claims, 'test-secret')}`;
const customer = bearer({ userId: USER, role: 'customer' });
const admin = bearer({ userId: USER, role: 'admin' });

beforeEach(() => mockedQuery.mockReset());

describe('access control', () => {
  it('requires sign-in to update a profile', async () => {
    const res = await request(app).put('/profile').send({ firstName: 'A', lastName: 'B' });
    expect(res.status).toBe(401);
  });

  it('keeps the customer list admin-only', async () => {
    expect((await request(app).get('/admin/customers')).status).toBe(401);
    expect((await request(app).get('/admin/customers').set('Authorization', customer)).status).toBe(403);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('keeps display names internal-only', async () => {
    expect((await request(app).get(`/internal/users/${USER}/display-name`).set('Authorization', admin)).status).toBe(403);
  });

  it('requires sign-in and valid coordinates for location lookup', async () => {
    expect((await request(app).get('/location/reverse?latitude=1&longitude=2')).status).toBe(401);
    expect((await request(app).get('/location/reverse?latitude=abc&longitude=2').set('Authorization', customer)).status).toBe(400);
    expect((await request(app).get('/location/reverse?latitude=91&longitude=2').set('Authorization', customer)).status).toBe(400);
  });
});

describe('PUT /profile', () => {
  it('rejects a missing name', async () => {
    const res = await request(app).put('/profile').set('Authorization', customer).send({ firstName: ' ', lastName: 'Doe' });
    expect(res.status).toBe(400);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('stores trimmed names and an E.164 phone', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: USER, email: 'j@example.com', first_name: 'Jane', last_name: 'Doe', phone: '+919876543210' }] } as any);
    const res = await request(app).put('/profile').set('Authorization', customer).send({ firstName: ' Jane ', lastName: 'Doe', phone: '98765 43210' });
    expect(res.status).toBe(200);
    expect(mockedQuery.mock.calls[0][1]).toEqual(['Jane', 'Doe', '+919876543210', null, USER]);
  });
});

describe('internal display name', () => {
  it('exposes first name and last initial only', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ first_name: 'Jane', last_name: 'Doe' }] } as any);
    const res = await request(app).get(`/internal/users/${USER}/display-name`).set('x-internal-token', 'internal-test-token');
    expect(res.body.data.displayName).toBe('Jane D.');
  });
});
