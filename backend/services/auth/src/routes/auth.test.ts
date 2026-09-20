import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import request from 'supertest';

vi.mock('../database/connection', () => ({
  query: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async () => 'hashed-password'),
    compare: vi.fn(async () => false),
  },
}));

import { createApp } from '../app';
import { query } from '../database/connection';
import bcrypt from 'bcryptjs';

const app = createApp();
const mockedQuery = vi.mocked(query);
// bcryptjs' compare() has an overloaded (callback-based) signature that makes
// vi.mocked() infer the wrong return type here, so mock it as a plain spy.
const mockedCompare = bcrypt.compare as unknown as Mock;

const sampleUser = {
  id: 1,
  email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
  role: 'customer',
  phone: null,
  address: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  mockedQuery.mockReset();
  mockedCompare.mockReset();
  mockedCompare.mockResolvedValue(false);
});

describe('POST /register', () => {
  it('creates a new user when the email is not already taken', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [] }) // existing-user lookup
      .mockResolvedValueOnce({ rows: [sampleUser] }); // insert

    const res = await request(app).post('/register').send({
      email: sampleUser.email,
      password: 'super-secret',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(sampleUser.email);
    expect(res.body.token).toBe(String(sampleUser.id));
  });

  it('rejects registration when the email already exists', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: sampleUser.id }] });

    const res = await request(app).post('/register').send({
      email: sampleUser.email,
      password: 'super-secret',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('User already exists');
  });
});

describe('POST /login', () => {
  it('rejects an unknown email with a normal (non-demo) password', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/login')
      .send({ email: 'nobody@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('rejects a known email with the wrong password', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ ...sampleUser, password_hash: 'hashed-password' }] });
    mockedCompare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/login')
      .send({ email: sampleUser.email, password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('logs in successfully with the correct password', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ ...sampleUser, password_hash: 'hashed-password' }] });
    mockedCompare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/login')
      .send({ email: sampleUser.email, password: 'super-secret' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(sampleUser.email);
    expect(res.body.message).toBe('Login successful');
  });

  it('creates a demo user on first demo login', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [] }) // no existing demo user
      .mockResolvedValueOnce({ rows: [sampleUser] }); // inserted demo user

    const res = await request(app)
      .post('/login')
      .send({ email: sampleUser.email, password: 'demo' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Demo login successful');
  });
});

describe('GET /me', () => {
  it('returns 401 when there is no bearer token', async () => {
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
  });

  it('returns the user for a valid bearer token', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [sampleUser] });

    const res = await request(app).get('/me').set('Authorization', `Bearer ${sampleUser.id}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(sampleUser.email);
  });
});

describe('POST /logout', () => {
  it('always succeeds', async () => {
    const res = await request(app).post('/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });
});
