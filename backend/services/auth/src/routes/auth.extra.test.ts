import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const h = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomBytes } = require('crypto');
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  process.env.GOOGLE_CLIENT_ID = 'test-client-id';
  process.env.DEMO_LOGIN_ENABLED = 'true';
  process.env.NODE_ENV = 'test';
  return { verifyIdToken: vi.fn() };
});

vi.mock('../database/connection', () => ({ query: vi.fn() }));
vi.mock('../clients/userService', () => ({ createProfile: vi.fn(async () => undefined) }));
vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(async () => 'hashed'), compare: vi.fn(async () => false) },
}));
vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(function () { return { verifyIdToken: h.verifyIdToken }; }),
}));

import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { createApp } from '../app';
import { query } from '../database/connection';
import { createProfile } from '../clients/userService';

const app = createApp();
const q = vi.mocked(query);
const compare = bcrypt.compare as unknown as ReturnType<typeof vi.fn>;
const secret = () => process.env.JWT_SECRET as string;
const pw = () => randomBytes(12).toString('hex');
const access = (userId = 'u1', role = 'customer') => jwt.sign({ userId, role }, secret());
const changeToken = (userId = 'u1') => jwt.sign({ userId, type: 'password_change' }, secret());
const user = { id: 'u1', email: 'a@example.com', role: 'customer', must_change_password: false };

beforeEach(() => {
  q.mockReset();
  compare.mockReset();
  compare.mockResolvedValue(false);
  vi.mocked(createProfile).mockClear();
  h.verifyIdToken.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /register errors', () => {
  it('rejects an invalid email', async () => {
    const res = await request(app).post('/register').send({ email: 'bad', password: pw() });
    expect(res.status).toBe(400);
  });
  it('returns 500 when the database fails', async () => {
    q.mockRejectedValueOnce(new Error('db'));
    const res = await request(app).post('/register').send({ email: 'a@example.com', password: pw(), firstName: 'A', lastName: 'B' });
    expect(res.status).toBe(500);
  });
});

describe('POST /login', () => {
  it('creates a demo account for a new email with "demo"', async () => {
    q.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [user] });
    const res = await request(app).post('/login').send({ email: 'a@example.com', password: 'demo' });
    expect(res.status).toBe(201);
    expect(createProfile).toHaveBeenCalledWith('u1', { email: user.email, firstName: 'Demo', lastName: 'User' });
  });
  it('falls through to the password check for an existing demo email', async () => {
    q.mockResolvedValueOnce({ rows: [{ id: 'u1' }] }).mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/login').send({ email: 'a@example.com', password: 'demo' });
    expect(res.status).toBe(401);
  });
  it('returns 500 when the database fails', async () => {
    q.mockRejectedValueOnce(new Error('db'));
    const res = await request(app).post('/login').send({ email: 'a@example.com', password: pw() });
    expect(res.status).toBe(500);
  });
});

describe('POST /google', () => {
  const payload = (p: any) => h.verifyIdToken.mockResolvedValueOnce({ getPayload: () => p });
  it('requires a credential', async () => {
    expect((await request(app).post('/google').send({})).status).toBe(400);
  });
  it('rejects an unverified email', async () => {
    payload({ email: 'a@example.com', email_verified: false });
    expect((await request(app).post('/google').send({ credential: 'c' })).status).toBe(401);
  });
  it('signs in an existing user', async () => {
    payload({ email: 'A@example.com', email_verified: true, given_name: 'A', family_name: 'B' });
    q.mockResolvedValueOnce({ rows: [user] });
    const res = await request(app).post('/google').send({ credential: 'c' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(createProfile).not.toHaveBeenCalled();
  });
  it('creates a new user, splitting the display name', async () => {
    payload({ email: 'a@example.com', email_verified: true, name: 'Jane Van Doe' });
    q.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [user] });
    const res = await request(app).post('/google').send({ credential: 'c' });
    expect(res.status).toBe(200);
    expect(createProfile).toHaveBeenCalledWith('u1', { email: user.email, firstName: 'Jane', lastName: 'Van Doe' });
  });
  it('uses fallback names when Google gives none', async () => {
    payload({ email: 'a@example.com', email_verified: true });
    q.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [user] });
    await request(app).post('/google').send({ credential: 'c' });
    expect(createProfile).toHaveBeenCalledWith('u1', { email: user.email, firstName: 'Google', lastName: 'User' });
  });
  it('returns 401 when verification throws', async () => {
    h.verifyIdToken.mockRejectedValueOnce(new Error('bad'));
    expect((await request(app).post('/google').send({ credential: 'c' })).status).toBe(401);
  });
});

describe('POST /complete-password-change', () => {
  const send = (body: any, token = changeToken()) =>
    request(app).post('/complete-password-change').set('Authorization', `Bearer ${token}`).send(body);
  it('rejects a user without a pending reset', async () => {
    q.mockResolvedValueOnce({ rows: [user] });
    expect((await send({ newPassword: pw() })).status).toBe(401);
  });
  it('rejects a short password for customers', async () => {
    q.mockResolvedValueOnce({ rows: [{ ...user, must_change_password: true }] });
    expect((await send({ newPassword: 'x' })).status).toBe(400);
  });
  it('returns 409 when the password was already changed concurrently', async () => {
    q.mockResolvedValueOnce({ rows: [{ ...user, must_change_password: true }] }).mockResolvedValueOnce({ rows: [] });
    expect((await send({ newPassword: pw() })).status).toBe(409);
  });
  it('returns 500 on database failure', async () => {
    q.mockRejectedValueOnce(new Error('db'));
    expect((await send({ newPassword: pw() })).status).toBe(500);
  });
  it('rejects without a bearer header', async () => {
    expect((await request(app).post('/complete-password-change').send({})).status).toBe(401);
  });
});

describe('POST /change-password', () => {
  const send = (body: any) => request(app).post('/change-password').set('Authorization', `Bearer ${access()}`).send(body);
  it('requires the current password', async () => {
    expect((await send({ newPassword: pw() })).status).toBe(400);
  });
  it('rejects reusing the same password', async () => {
    const p = pw();
    expect((await send({ currentPassword: p, newPassword: p })).status).toBe(400);
  });
  it('returns 404 for an unknown user', async () => {
    q.mockResolvedValueOnce({ rows: [] });
    expect((await send({ currentPassword: pw(), newPassword: pw() })).status).toBe(404);
  });
  it('returns 500 on database failure', async () => {
    q.mockRejectedValueOnce(new Error('db'));
    expect((await send({ currentPassword: pw(), newPassword: pw() })).status).toBe(500);
  });
});

describe('GET /me and roles errors', () => {
  it('returns 401 for a deleted user', async () => {
    q.mockResolvedValueOnce({ rows: [] });
    expect((await request(app).get('/me').set('Authorization', `Bearer ${access()}`)).status).toBe(401);
  });
  it('returns 500 on database failure', async () => {
    q.mockRejectedValueOnce(new Error('db'));
    expect((await request(app).get('/me').set('Authorization', `Bearer ${access()}`)).status).toBe(500);
  });
  it('roles: returns 500 on database failure and skips the id query without ids', async () => {
    const token = randomBytes(16).toString('hex');
    process.env.INTERNAL_API_TOKEN = token;
    q.mockRejectedValueOnce(new Error('db'));
    const res = await request(app).get('/internal/accounts/roles').set('x-internal-token', token);
    expect(res.status).toBe(500);
    expect(q).toHaveBeenCalledTimes(1);
  });
});

describe('POST /refresh', () => {
  it('rejects a refresh token without a userId', async () => {
    const t = jwt.sign({ type: 'refresh' }, secret());
    expect((await request(app).post('/refresh').send({ refreshToken: t })).status).toBe(401);
  });
});

describe('app error handler', () => {
  it('returns 500 for malformed JSON bodies', async () => {
    const res = await request(app).post('/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(500);
  });
});
