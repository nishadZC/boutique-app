import { describe, it, expect, vi, afterEach } from 'vitest';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { getJwtSecret, readAuth, requireUser, requireAdmin, requireInternal, hasInternalToken } from '@boutique/shared';

const saved = { ...process.env };
afterEach(() => { process.env = { ...saved }; });

const reqWith = (headers: Record<string, string> = {}) => ({
  headers,
  header: (n: string) => headers[n.toLowerCase()],
}) as any;
const resMock = () => {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};
const bearer = (payload: object, secret: string) => ({ authorization: `Bearer ${jwt.sign(payload, secret)}` });

describe('getJwtSecret', () => {
  it('returns JWT_SECRET when set', () => {
    const s = randomBytes(16).toString('hex');
    process.env.JWT_SECRET = s;
    expect(getJwtSecret()).toBe(s);
  });
  it('throws in production without a secret', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    expect(() => getJwtSecret()).toThrow(/production/);
  });
  it('falls back to a dev secret outside production', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'test';
    expect(getJwtSecret()).toBeTruthy();
  });
});

describe('readAuth / requireUser / requireAdmin', () => {
  const secret = randomBytes(16).toString('hex');
  const setup = () => { process.env.JWT_SECRET = secret; };

  it('defaults the role to customer and rejects typed tokens', () => {
    setup();
    expect(readAuth(reqWith(bearer({ userId: 'u' }, secret)))).toEqual({ userId: 'u', email: undefined, role: 'customer' });
    expect(readAuth(reqWith(bearer({ userId: 'u', type: 'refresh' }, secret)))).toBeNull();
    expect(readAuth(reqWith({ authorization: 'Bearer garbage' }))).toBeNull();
    expect(readAuth(reqWith({ authorization: 'Basic x' }))).toBeNull();
  });
  it('requireUser rejects and accepts', () => {
    setup();
    const res = resMock(); const next = vi.fn();
    requireUser(reqWith(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    const req = reqWith(bearer({ userId: 'u' }, secret));
    requireUser(req, resMock(), next);
    expect(next).toHaveBeenCalled();
    expect(req.auth.userId).toBe('u');
  });
  it('requireAdmin returns 401, 403, then next', () => {
    setup();
    let res = resMock(); const next = vi.fn();
    requireAdmin(reqWith(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    res = resMock();
    requireAdmin(reqWith(bearer({ userId: 'u', role: 'customer' }, secret)), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    const req = reqWith(bearer({ userId: 'u', role: 'admin' }, secret));
    requireAdmin(req, resMock(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.auth.role).toBe('admin');
  });
});

describe('internal token', () => {
  it('compares tokens and guards routes', () => {
    const t = randomBytes(16).toString('hex');
    delete process.env.INTERNAL_API_TOKEN;
    expect(hasInternalToken(reqWith({ 'x-internal-token': t }))).toBe(false);
    process.env.INTERNAL_API_TOKEN = t;
    expect(hasInternalToken(reqWith({ 'x-internal-token': t + 'x' }))).toBe(false);
    expect(hasInternalToken(reqWith({ 'x-internal-token': t }))).toBe(true);
    const res = resMock(); const next = vi.fn();
    requireInternal(reqWith(), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    requireInternal(reqWith({ 'x-internal-token': t }), resMock(), next);
    expect(next).toHaveBeenCalled();
  });
});
