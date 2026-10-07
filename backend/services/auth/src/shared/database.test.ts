import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { randomBytes } from 'crypto';

const h = vi.hoisted(() => ({ query: vi.fn(), Pool: vi.fn() }));
vi.mock('pg', () => ({
  Pool: h.Pool.mockImplementation(function (this: any) {
    return { query: h.query, totalCount: 0, idleCount: 0, waitingCount: 0 };
  }),
}));

import { createDatabase } from '@boutique/shared';

const saved = { ...process.env };
beforeEach(() => {
  h.query.mockReset(); h.Pool.mockClear();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { process.env = { ...saved }; });

describe('createDatabase', () => {
  it('throws before connecting', () => {
    const db = createDatabase({ defaultDatabase: 'd' });
    expect(() => db.query('x')).toThrow('Database not connected');
    expect(() => db.getPool()).toThrow('Database not connected');
  });
  it('connects with DATABASE_URL', async () => {
    process.env.DATABASE_URL = 'postgres://example/db';
    h.query.mockResolvedValue({ rows: [] });
    const db = createDatabase({ defaultDatabase: 'd', label: 'auth service' });
    await db.connectDB();
    expect(h.Pool.mock.calls[0][0]).toMatchObject({ connectionString: 'postgres://example/db', max: 20 });
    expect(db.getPool()).toBeTruthy();
    await db.query('SELECT 1', [1]);
    expect(h.query).toHaveBeenLastCalledWith('SELECT 1', [1]);
  });
  it('falls back to individual env vars', async () => {
    delete process.env.DATABASE_URL;
    delete process.env.DB_HOST; delete process.env.DB_PORT; delete process.env.DB_NAME; delete process.env.DB_USER;
    process.env.DB_PASSWORD = randomBytes(8).toString('hex');
    h.query.mockResolvedValue({ rows: [] });
    await createDatabase({ defaultDatabase: 'mydb' }).connectDB();
    expect(h.Pool.mock.calls[0][0]).toMatchObject({ host: 'localhost', port: 5432, database: 'mydb', user: 'postgres', password: process.env.DB_PASSWORD });
  });
  it('rethrows a connection failure', async () => {
    h.query.mockRejectedValue(new Error('refused'));
    await expect(createDatabase({ defaultDatabase: 'd' }).connectDB()).rejects.toThrow('refused');
  });
});
