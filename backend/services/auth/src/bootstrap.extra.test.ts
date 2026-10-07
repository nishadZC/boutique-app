import { describe, it, expect, vi, beforeEach } from 'vitest';
import { randomBytes } from 'crypto';

vi.mock('./clients/userService', () => ({ createProfile: vi.fn() }));
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(async () => 'hashed') } }));

import { ensureBootstrapAdmin } from './bootstrap';
import { createProfile } from './clients/userService';

const strong = () => randomBytes(16).toString('hex');

beforeEach(() => {
  vi.mocked(createProfile).mockClear();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ensureBootstrapAdmin (fast hash)', () => {
  it('skips an invalid ADMIN_EMAIL without querying', async () => {
    const query = vi.fn();
    expect(await ensureBootstrapAdmin(query, { ADMIN_EMAIL: 'not-an-email', ADMIN_INITIAL_PASSWORD: strong() })).toBe('skipped');
    expect(query).not.toHaveBeenCalled();
  });
  it('uses the default email and creates the admin', async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ id: 'x' }] });
    expect(await ensureBootstrapAdmin(query, { ADMIN_INITIAL_PASSWORD: strong() })).toBe('created');
    expect(query.mock.calls[1][1]).toEqual(['admin@luxatelier.in', 'hashed']);
    expect(createProfile).toHaveBeenCalled();
  });
  it('reports exists when the insert hits a conflict', async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });
    expect(await ensureBootstrapAdmin(query, { ADMIN_INITIAL_PASSWORD: strong() })).toBe('exists');
    expect(createProfile).not.toHaveBeenCalled();
  });
});
