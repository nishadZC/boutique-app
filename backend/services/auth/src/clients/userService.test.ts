import { describe, it, expect, vi, afterEach } from 'vitest';
import { createProfile } from './userService';

const profile = { email: 'a@example.com', firstName: 'A', lastName: 'B' };

afterEach(() => vi.unstubAllGlobals());

describe('createProfile', () => {
  it('PUTs the profile to the user service with the internal token', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await createProfile('u1', profile);
    const [url, init] = fetchMock.mock.calls[0] as any;
    expect(url).toMatch(/\/internal\/users\/u1\/profile$/);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual(profile);
  });
  it('logs a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await createProfile('u1', profile);
    expect(err.mock.calls[0][0]).toMatch(/503/);
  });
  it('swallows network errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(createProfile('u1', profile)).resolves.toBeUndefined();
    expect(err).toHaveBeenCalled();
  });
});
