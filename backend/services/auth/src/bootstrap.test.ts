import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { ensureBootstrapAdmin } from './bootstrap';

const env = (extra: Record<string, string> = {}) => ({ ADMIN_EMAIL: 'Admin@LuxAtelier.in', ADMIN_INITIAL_PASSWORD: 'initial-secret-123', ...extra });

describe('ensureBootstrapAdmin', () => {
  it('creates the admin with a hashed password and a forced reset', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'x' }] });

    expect(await ensureBootstrapAdmin(query, env())).toBe('created');

    expect(query.mock.calls[0][1]).toEqual(['admin@luxatelier.in']);
    const [sql, [email, hash]] = query.mock.calls[1];
    expect(sql).toMatch(/'admin', true/);
    expect(email).toBe('admin@luxatelier.in');
    expect(hash).not.toBe('initial-secret-123');
    expect(await bcrypt.compare('initial-secret-123', hash)).toBe(true);
  });

  it('never touches an existing account (redeploys cannot reset the password)', async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [{ id: 'x' }] });
    expect(await ensureBootstrapAdmin(query, env())).toBe('exists');
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('refuses a missing or weak initial password', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    expect(await ensureBootstrapAdmin(query, env({ ADMIN_INITIAL_PASSWORD: 'short' }))).toBe('skipped');
    expect(await ensureBootstrapAdmin(query, { ADMIN_EMAIL: 'admin@luxatelier.in' })).toBe('skipped');
    expect(query.mock.calls.some(c => String(c[0]).includes('INSERT'))).toBe(false);
  });
});
