import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'crypto';

vi.mock('../database/connection', () => ({
  query: vi.fn(),
}));

vi.mock('../clients/userService', () => ({
  createProfile: vi.fn(async () => undefined),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async () => 'hashed-password'),
    compare: vi.fn(async () => false),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn((payload: { userId: string; type?: string }) =>
      payload.type === 'refresh' ? `refresh-token-for-${payload.userId}`
        : payload.type === 'password_change' ? `pwchange-token-for-${payload.userId}`
          : `token-for-${payload.userId}`
    ),
    verify: vi.fn((token: string) => {
      const refreshMatch = /^refresh-token-for-(.+)$/.exec(token);
      if (refreshMatch) return { userId: refreshMatch[1], type: 'refresh' };
      const changeMatch = /^pwchange-token-for-(.+)$/.exec(token);
      if (changeMatch) return { userId: changeMatch[1], type: 'password_change' };
      const match = /^token-for-(.+)$/.exec(token);
      if (match) return { userId: match[1] };
      throw new Error('invalid token');
    }),
  },
}));

import { createApp } from '../app';
import { query } from '../database/connection';
import { createProfile } from '../clients/userService';
import bcrypt from 'bcryptjs';

// Fresh random value on every run: no token is ever written in the code.
const TEST_INTERNAL_TOKEN = randomBytes(24).toString('hex');

const app = createApp();
const mockedQuery = vi.mocked(query);
const mockedCreateProfile = vi.mocked(createProfile);
// bcryptjs' compare() has an overloaded (callback-based) signature that makes
// vi.mocked() infer the wrong return type here, so mock it as a plain spy.
const mockedCompare = bcrypt.compare as unknown as Mock;

const sampleUser = {
  id: 1,
  email: 'jane@example.com',
  role: 'customer',
  must_change_password: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  mockedQuery.mockReset();
  mockedCreateProfile.mockClear();
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
    expect(res.body.token).toBe(`token-for-${sampleUser.id}`);
  });

  it('keeps names out of auth_db and sends them to the user service', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [sampleUser] });

    const res = await request(app).post('/register').send({
      email: sampleUser.email, password: 'super-secret', firstName: ' Jane ', lastName: 'Doe',
    });

    expect(res.status).toBe(201);
    expect(mockedQuery.mock.calls[1][0]).not.toMatch(/first_name|last_name|phone|address/);
    expect(mockedCreateProfile).toHaveBeenCalledWith(sampleUser.id, { email: sampleUser.email, firstName: 'Jane', lastName: 'Doe' });
    expect(res.body.user).not.toHaveProperty('firstName');
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

  it.each(['not-an-email', 'jane@example', 'jane..doe@example.com', ''])(
    'rejects the invalid email %j without touching the database',
    async (email) => {
      const res = await request(app).post('/register').send({
        email, password: 'super-secret', firstName: 'Jane', lastName: 'Doe',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Enter a valid email address');
      expect(mockedQuery).not.toHaveBeenCalled();
    },
  );

  it('rejects a password shorter than 8 characters', async () => {
    const res = await request(app).post('/register').send({
      email: sampleUser.email, password: 'short', firstName: 'Jane', lastName: 'Doe',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 8 characters/);
  });

  it('rejects a missing name', async () => {
    const res = await request(app).post('/register').send({
      email: sampleUser.email, password: 'super-secret', firstName: '  ', lastName: 'Doe',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('First and last name are required');
  });

  it('stores the email trimmed and lowercased', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [sampleUser] });

    await request(app).post('/register').send({
      email: '  Jane@Example.COM ', password: 'super-secret', firstName: 'Jane', lastName: 'Doe',
    });

    expect(mockedQuery.mock.calls[0][1]).toEqual(['jane@example.com']);
    expect(mockedQuery.mock.calls[1][1]?.[0]).toBe('jane@example.com');
  });
});

describe('POST /login', () => {
  it('rejects a malformed email before looking anything up', async () => {
    const res = await request(app).post('/login').send({ email: 'jane', password: 'whatever' });

    expect(res.status).toBe(400);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('matches the email case-insensitively', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] });

    await request(app).post('/login').send({ email: 'Jane@Example.com', password: 'wrong' });

    expect(mockedQuery.mock.calls[0][0]).toMatch(/LOWER\(email\) = \$1/);
    expect(mockedQuery.mock.calls[0][1]).toEqual(['jane@example.com']);
  });

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

  it('never signs in to an existing account with the password "demo"', async () => {
    // Regression: demo mode used to issue a token for ANY existing user
    // (including admins) when the password was "demo".
    mockedQuery.mockResolvedValueOnce({ rows: [{ ...sampleUser, role: 'admin', password_hash: 'hashed-password' }] });
    mockedCompare.mockResolvedValueOnce(false);

    const res = await request(app).post('/login').send({ email: sampleUser.email, password: 'demo' });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it('does not auto-create demo accounts unless DEMO_LOGIN_ENABLED is set', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/login').send({ email: 'new.person@example.com', password: 'demo' });

    expect(res.status).toBe(401);
    expect(mockedQuery).toHaveBeenCalledTimes(1);
    expect(mockedQuery.mock.calls[0][0]).not.toMatch(/INSERT/);
  });
});

describe('forced password change (bootstrap admin)', () => {
  const pendingAdmin = { ...sampleUser, id: 'admin-1', role: 'admin', password_hash: 'hashed-password', must_change_password: true };
  const changeToken = (userId: string) => `Bearer pwchange-token-for-${userId}`;

  it('returns only a password-change token, never a session', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [pendingAdmin] });
    mockedCompare.mockResolvedValueOnce(true);

    const res = await request(app).post('/login').send({ email: 'admin@luxatelier.in', password: 'initial-secret-123' });

    expect(res.status).toBe(200);
    expect(res.body.passwordChangeRequired).toBe(true);
    expect(res.body.passwordChangeToken).toBe('pwchange-token-for-admin-1');
    expect(res.body.token).toBeUndefined();
    expect(res.body.refreshToken).toBeUndefined();
  });

  it('rejects the password-change token as an access token', async () => {
    const res = await request(app).get('/me').set('Authorization', changeToken('admin-1'));
    expect(res.status).toBe(401);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('only accepts a password-change token', async () => {
    const res = await request(app).post('/complete-password-change').set('Authorization', `Bearer token-for-admin-1`).send({ newPassword: 'a-brand-new-password' });
    expect(res.status).toBe(401);
  });

  it('requires 12+ characters for admins', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [pendingAdmin] });
    const res = await request(app).post('/complete-password-change').set('Authorization', changeToken('admin-1')).send({ newPassword: 'short-pw1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 12/);
  });

  it('refuses to keep the initial password', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [pendingAdmin] });
    mockedCompare.mockResolvedValueOnce(true);
    const res = await request(app).post('/complete-password-change').set('Authorization', changeToken('admin-1')).send({ newPassword: 'initial-secret-123' });
    expect(res.status).toBe(400);
  });

  it('saves the new password, clears the flag and signs in', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [pendingAdmin] })
      .mockResolvedValueOnce({ rows: [{ ...pendingAdmin, must_change_password: false }] });
    mockedCompare.mockResolvedValueOnce(false);

    const res = await request(app).post('/complete-password-change').set('Authorization', changeToken('admin-1')).send({ newPassword: 'a-brand-new-password' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('token-for-admin-1');
    expect(res.body.user.role).toBe('admin');
    expect(mockedQuery.mock.calls[1][0]).toMatch(/must_change_password = false/);
  });

  it('blocks token refresh while a reset is pending', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: 'admin-1', role: 'admin', must_change_password: true }] });
    const res = await request(app).post('/refresh').send({ refreshToken: 'refresh-token-for-admin-1' });
    expect(res.status).toBe(401);
  });
});

describe('POST /change-password', () => {
  const auth = { Authorization: `Bearer token-for-${sampleUser.id}` };

  it('requires a signed-in user', async () => {
    const res = await request(app).post('/change-password').send({ currentPassword: 'a', newPassword: 'longenough' });
    expect(res.status).toBe(401);
  });

  it('rejects a short new password', async () => {
    const res = await request(app).post('/change-password').set(auth).send({ currentPassword: 'old-password', newPassword: 'short' });
    expect(res.status).toBe(400);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('rejects a wrong current password', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ password_hash: 'hashed-password' }] });
    mockedCompare.mockResolvedValueOnce(false);

    const res = await request(app).post('/change-password').set(auth).send({ currentPassword: 'wrong', newPassword: 'brand-new-secret' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Current password is incorrect');
  });

  it('stores a new hash when the current password matches', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ password_hash: 'hashed-password' }] })
      .mockResolvedValueOnce({ rows: [] });
    mockedCompare.mockResolvedValueOnce(true);

    const res = await request(app).post('/change-password').set(auth).send({ currentPassword: 'old-password', newPassword: 'brand-new-secret' });

    expect(res.status).toBe(200);
    expect(mockedQuery.mock.calls[1][0]).toMatch(/UPDATE users SET password_hash/);
    expect(mockedQuery.mock.calls[1][1]).toEqual(['hashed-password', String(sampleUser.id)]);
  });
});

describe('GET /me', () => {
  it('returns 401 when there is no bearer token', async () => {
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
  });

  it('rejects a refresh token used as an access token', async () => {
    const res = await request(app).get('/me').set('Authorization', `Bearer refresh-token-for-${sampleUser.id}`);
    expect(res.status).toBe(401);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('returns the user for a valid bearer token', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [sampleUser] });

    const res = await request(app).get('/me').set('Authorization', `Bearer token-for-${sampleUser.id}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(sampleUser.email);
    expect(res.body.role).toBe('customer');
  });
});

describe('GET /internal/accounts/roles', () => {
  const ID = '11111111-1111-4111-8111-111111111111';

  it('is internal-only', async () => {
    process.env.INTERNAL_API_TOKEN = TEST_INTERNAL_TOKEN;
    const res = await request(app).get(`/internal/accounts/roles?ids=${ID}`).set('Authorization', `Bearer token-for-${ID}`);
    expect(res.status).toBe(403);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('returns roles for valid ids and the admin count', async () => {
    process.env.INTERNAL_API_TOKEN = TEST_INTERNAL_TOKEN;
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ id: ID, role: 'admin' }] })
      .mockResolvedValueOnce({ rows: [{ n: '2' }] });

    const res = await request(app).get(`/internal/accounts/roles?ids=${ID},not-a-uuid`).set('x-internal-token', TEST_INTERNAL_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ roles: { [ID]: 'admin' }, admins: 2 });
    expect(mockedQuery.mock.calls[0][1]).toEqual([[ID]]);
  });
});

describe('POST /refresh', () => {
  it('rejects a missing refresh token', async () => {
    const res = await request(app).post('/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('rejects an access token used as a refresh token', async () => {
    const res = await request(app).post('/refresh').send({ refreshToken: `token-for-${sampleUser.id}` });
    expect(res.status).toBe(401);
  });

  it('rejects an unparseable refresh token', async () => {
    const res = await request(app).post('/refresh').send({ refreshToken: 'garbage' });
    expect(res.status).toBe(401);
  });

  it('issues a new access token for a valid refresh token', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [sampleUser] });

    const res = await request(app)
      .post('/refresh')
      .send({ refreshToken: `refresh-token-for-${sampleUser.id}` });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe(`token-for-${sampleUser.id}`);
  });

  it('rejects a refresh token for a user that no longer exists', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/refresh')
      .send({ refreshToken: `refresh-token-for-${sampleUser.id}` });

    expect(res.status).toBe(401);
  });
});

describe('POST /logout', () => {
  it('always succeeds', async () => {
    const res = await request(app).post('/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });
});
