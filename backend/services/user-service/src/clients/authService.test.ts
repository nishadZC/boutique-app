import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchAccountRoles } from './authService';

afterEach(() => vi.unstubAllGlobals());

describe('fetchAccountRoles', () => {
  it('requests roles for the ids and returns data', async () => {
    const data = { roles: { a: 'admin' }, admins: 1 };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ data }) }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchAccountRoles(['a', 'b'])).toEqual(data);
    const url = (fetchMock.mock.calls[0] as any)[0] as URL;
    expect(url.pathname).toBe('/internal/accounts/roles');
    expect(url.searchParams.get('ids')).toBe('a,b');
  });
  it('throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })));
    await expect(fetchAccountRoles([])).rejects.toThrow('Auth service returned 500');
  });
});
