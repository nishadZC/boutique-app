import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const h = { fetch: vi.fn() };
vi.mock('../database/connection', () => ({ query: vi.fn(), pool: {} }));
vi.mock('../metrics', () => ({ setupMetrics: vi.fn(), metricsMiddleware: (_q: unknown, _s: unknown, next: () => void) => next() }));
vi.mock('../clients/authService', () => ({ fetchAccountRoles: vi.fn() }));

import { createApp } from '../app';
import { query } from '../database/connection';
import { fetchAccountRoles } from '../clients/authService';

const SECRET = randomBytes(32).toString('hex');
const INTERNAL = randomBytes(24).toString('hex');
process.env.JWT_SECRET = SECRET;
process.env.INTERNAL_API_TOKEN = INTERNAL;
const app = createApp();
const q = vi.mocked(query);
const roles = vi.mocked(fetchAccountRoles);
const USER = '11111111-1111-4111-8111-111111111111';
const customer = `Bearer ${jwt.sign({ userId: USER, email: 'j@example.com', role: 'customer' }, SECRET)}`;
const admin = `Bearer ${jwt.sign({ userId: USER, role: 'admin' }, SECRET)}`;

beforeEach(() => {
  q.mockReset(); roles.mockReset(); h.fetch.mockReset();
  vi.stubGlobal('fetch', h.fetch);
  delete process.env.AZURE_MAPS_SUBSCRIPTION_KEY;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('admin routes', () => {
  it('searches customers with paging params and defaults role to customer', async () => {
    q.mockResolvedValueOnce({ rows: [{ user_id: USER, email: 'j@example.com' }] } as any)
      .mockResolvedValueOnce({ rows: [{ total: '30' }] } as any)
      .mockResolvedValueOnce({ rows: [{ total: '40', new_30d: '2' }] } as any);
    roles.mockResolvedValueOnce({ roles: {}, admins: 1 });
    const res = await request(app).get('/admin/customers?search=jo&page=2&limit=10').set('Authorization', admin);
    expect(res.status).toBe(200);
    expect(q.mock.calls[0][1]).toEqual(['%jo%', 10, 10]);
    expect(res.body.data.customers[0].role).toBe('customer');
    expect(res.body.data.pagination).toEqual({ page: 2, limit: 10, total: 30, totalPages: 3 });
  });
  it('lookup returns empty data without valid ids', async () => {
    const res = await request(app).get('/admin/customers/lookup?ids=nope').set('Authorization', admin);
    expect(res.body).toEqual({ success: true, data: {} });
    expect(q).not.toHaveBeenCalled();
  });
  it('lookup maps rows by user id', async () => {
    q.mockResolvedValueOnce({ rows: [{ user_id: USER, email: 'e', first_name: 'F', last_name: 'L', phone: null }] } as any);
    const res = await request(app).get(`/admin/customers/lookup?ids=${USER},bad`).set('Authorization', admin);
    expect(res.body.data[USER]).toEqual({ id: USER, email: 'e', firstName: 'F', lastName: 'L', phone: null });
  });
  it('lookup returns 500 on database failure', async () => {
    q.mockRejectedValueOnce(new Error('db'));
    expect((await request(app).get(`/admin/customers/lookup?ids=${USER}`).set('Authorization', admin)).status).toBe(500);
  });
});

describe('internal routes', () => {
  const put = (id: string, body: object) => request(app).put(`/internal/users/${id}/profile`).set('x-internal-token', INTERNAL).send(body);
  const get = (id: string) => request(app).get(`/internal/users/${id}/display-name`).set('x-internal-token', INTERNAL);
  it('validates id and body when creating a profile', async () => {
    expect((await put('bad', { email: 'a@b.co' })).status).toBe(400);
    const res = await put(USER, {});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/);
  });
  it('creates a profile with a lowercased email', async () => {
    q.mockResolvedValueOnce({ rows: [] } as any);
    expect((await put(USER, { email: 'A@B.co', firstName: 'A', lastName: 'B' })).status).toBe(200);
    expect(q.mock.calls[0][1]).toEqual([USER, 'a@b.co', 'A', 'B']);
  });
  it('returns 500 when profile creation fails', async () => {
    q.mockRejectedValueOnce(new Error('db'));
    expect((await put(USER, { email: 'a@b.co' })).status).toBe(500);
  });
  it('display name: 404s for bad id and unknown user', async () => {
    expect((await get('bad')).status).toBe(404);
    q.mockResolvedValueOnce({ rows: [] } as any);
    expect((await get(USER)).status).toBe(404);
  });
  it('display name: first name + initial, or a fallback', async () => {
    q.mockResolvedValueOnce({ rows: [{ first_name: 'Jane', last_name: 'Doe' }] } as any);
    expect((await get(USER)).body.data.displayName).toBe('Jane D.');
    q.mockResolvedValueOnce({ rows: [{ first_name: '', last_name: null }] } as any);
    expect((await get(USER)).body.data.displayName).toBe('Verified buyer');
  });
  it('display name: 500 on database failure', async () => {
    q.mockRejectedValueOnce(new Error('db'));
    expect((await get(USER)).status).toBe(500);
  });
});

describe('profile routes', () => {
  it('GET returns a stub profile when none exists', async () => {
    q.mockResolvedValueOnce({ rows: [] } as any);
    const res = await request(app).get('/profile').set('Authorization', customer);
    expect(res.status).toBe(200);
  });
  it('GET returns 500 on database failure', async () => {
    q.mockRejectedValueOnce(new Error('db'));
    expect((await request(app).get('/profile').set('Authorization', customer)).status).toBe(500);
  });
  it('PUT rejects an invalid phone', async () => {
    const res = await request(app).put('/profile').set('Authorization', customer).send({ firstName: 'A', lastName: 'B', phone: '12345' });
    expect(res.status).toBe(400);
  });
  it('PUT returns 500 on database failure', async () => {
    q.mockRejectedValueOnce(new Error('db'));
    expect((await request(app).put('/profile').set('Authorization', customer).send({ firstName: 'A', lastName: 'B' })).status).toBe(500);
  });
});

describe('location reverse geocoding', () => {
  const get = (qs = 'latitude=12.9&longitude=77.6') => request(app).get(`/location/reverse?${qs}`).set('Authorization', customer);
  const ok = (body: unknown) => ({ ok: true, json: async () => body });
  const configure = () => { const key = randomBytes(16).toString('hex'); process.env.AZURE_MAPS_SUBSCRIPTION_KEY = key; return key; };
  it('503s when not configured', async () => {
    expect((await get()).status).toBe(503);
  });
  it('400s on invalid coordinates', async () => {
    configure();
    expect((await get('latitude=abc&longitude=1')).status).toBe(400);
    expect((await get('latitude=91&longitude=1')).status).toBe(400);
    expect((await get('latitude=1&longitude=181')).status).toBe(400);
    expect(h.fetch).not.toHaveBeenCalled();
  });
  it('maps the Azure Maps address', async () => {
    const key = configure();
    h.fetch.mockResolvedValueOnce(ok({ addresses: [{ address: { streetNumber: '1', streetName: 'MG Rd', municipality: 'Bengaluru', countrySubdivision: 'KA', postalCode: '560001', country: 'India' } }] }));
    const res = await get();
    expect(res.body.data).toEqual({ houseNumber: '1', street: 'MG Rd', city: 'Bengaluru', state: 'KA', postalCode: '560001', country: 'India' });
    const url = h.fetch.mock.calls[0][0] as URL;
    expect(url.origin + url.pathname).toBe('https://atlas.microsoft.com/search/address/reverse/json');
    expect(url.searchParams.get('query')).toBe('12.9,77.6');
    expect(url.searchParams.get('subscription-key')).toBe(key);
    expect(url.searchParams.get('api-version')).toBe('1.0');
  });
  it('fills missing fields with empty strings and defaults country', async () => {
    configure();
    h.fetch.mockResolvedValueOnce(ok({ addresses: [{ address: {} }] }));
    expect((await get()).body.data).toEqual({ houseNumber: '', street: '', city: '', state: '', postalCode: '', country: 'India' });
  });
  it('404s with no result, 502s on non-ok responses and fetch errors', async () => {
    configure();
    h.fetch.mockResolvedValueOnce(ok({}));
    expect((await get()).status).toBe(404);
    h.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    expect((await get()).status).toBe(502);
    h.fetch.mockRejectedValueOnce(new Error('network'));
    expect((await get()).status).toBe(502);
  });
});
