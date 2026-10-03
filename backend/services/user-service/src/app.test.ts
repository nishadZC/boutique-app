import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('./database/connection', () => ({ query: vi.fn(), pool: {} }));
vi.mock('./metrics', () => ({ setupMetrics: vi.fn(), metricsMiddleware: (_q: unknown, _s: unknown, next: () => void) => next() }));
vi.mock('./clients/authService', () => ({ fetchAccountRoles: vi.fn() }));

import { createApp } from './app';
import { fetchAccountRoles } from './clients/authService';
import { query } from './database/connection';

process.env.JWT_SECRET = 'test-secret';
process.env.INTERNAL_API_TOKEN = 'internal-test-token';
const app = createApp();
const mockedQuery = vi.mocked(query);
const mockedRoles = vi.mocked(fetchAccountRoles);
const USER = '11111111-1111-4111-8111-111111111111';
const bearer = (claims: object) => `Bearer ${jwt.sign(claims, 'test-secret')}`;
const customer = bearer({ userId: USER, email: 'j@example.com', role: 'customer' });
const admin = bearer({ userId: USER, role: 'admin' });

beforeEach(() => {
  mockedQuery.mockReset();
  mockedRoles.mockReset();
});

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
    mockedQuery.mockResolvedValueOnce({ rows: [{ user_id: USER, email: 'j@example.com', first_name: 'Jane', last_name: 'Doe', phone: '+919876543210' }] } as any);
    const res = await request(app).put('/profile').set('Authorization', customer).send({ firstName: ' Jane ', lastName: 'Doe', phone: '98765 43210' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: USER, firstName: 'Jane', phone: '+919876543210' });
    expect(mockedQuery.mock.calls[0][0]).toMatch(/INSERT INTO profiles[\s\S]*ON CONFLICT \(user_id\) DO UPDATE/);
    expect(mockedQuery.mock.calls[0][1]).toEqual(['Jane', 'Doe', '+919876543210', null, USER, 'j@example.com']);
  });
});

describe('GET /profile', () => {
  it('returns the stored profile', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ user_id: USER, email: 'j@example.com', first_name: 'Jane', last_name: 'Doe' }] } as any);
    const res = await request(app).get('/profile').set('Authorization', customer);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: USER, email: 'j@example.com', firstName: 'Jane', lastName: 'Doe' });
    expect(res.body).not.toHaveProperty('role');
  });

  it('returns a blank profile when there is none yet', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] } as any);
    const res = await request(app).get('/profile').set('Authorization', customer);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: USER, email: 'j@example.com', firstName: '', lastName: '' });
  });
});

describe('internal profile creation', () => {
  const internal = { 'x-internal-token': 'internal-test-token' };

  it('is internal-only', async () => {
    const res = await request(app).put(`/internal/users/${USER}/profile`).set('Authorization', admin).send({ email: 'j@example.com' });
    expect(res.status).toBe(403);
  });

  it('validates the id and the email', async () => {
    expect((await request(app).put('/internal/users/abc/profile').set(internal).send({ email: 'j@example.com' })).status).toBe(400);
    expect((await request(app).put(`/internal/users/${USER}/profile`).set(internal).send({ email: 'nope' })).status).toBe(400);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('creates the profile', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] } as any);
    const res = await request(app).put(`/internal/users/${USER}/profile`).set(internal).send({ email: 'J@Example.com', firstName: 'Jane', lastName: 'Doe' });
    expect(res.status).toBe(200);
    expect(mockedQuery.mock.calls[0][1]).toEqual([USER, 'j@example.com', 'Jane', 'Doe']);
  });
});

describe('admin customer list', () => {
  const rows = { rows: [{ user_id: USER, email: 'j@example.com', first_name: 'Jane', last_name: 'Doe' }] };
  const counts = () => mockedQuery
    .mockResolvedValueOnce(rows as any)
    .mockResolvedValueOnce({ rows: [{ total: '1' }] } as any)
    .mockResolvedValueOnce({ rows: [{ total: '1', new_30d: '1' }] } as any);

  it('adds roles and the admin count from the auth service', async () => {
    counts();
    mockedRoles.mockResolvedValueOnce({ roles: { [USER]: 'admin' }, admins: 3 });
    const res = await request(app).get('/admin/customers').set('Authorization', admin);
    expect(res.status).toBe(200);
    expect(mockedRoles).toHaveBeenCalledWith([USER]);
    expect(res.body.data.customers[0]).toMatchObject({ id: USER, role: 'admin' });
    expect(res.body.data.summary).toEqual({ totalAccounts: 1, newLast30Days: 1, admins: 3 });
  });

  it('fails when the auth service is down', async () => {
    counts();
    mockedRoles.mockRejectedValueOnce(new Error('down'));
    const res = await request(app).get('/admin/customers').set('Authorization', admin);
    expect(res.status).toBe(500);
  });
});

describe('internal display name', () => {
  it('exposes first name and last initial only', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ first_name: 'Jane', last_name: 'Doe' }] } as any);
    const res = await request(app).get(`/internal/users/${USER}/display-name`).set('x-internal-token', 'internal-test-token');
    expect(res.body.data.displayName).toBe('Jane D.');
  });
});
