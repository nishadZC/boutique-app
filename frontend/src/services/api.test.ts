import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
  const state: { req?: [any, any]; res?: [any, any] } = {};
  const instance: any = vi.fn();
  instance.interceptors = {
    request: { use: (a: any, b: any) => { state.req = [a, b]; } },
    response: { use: (a: any, b: any) => { state.res = [a, b]; } },
  };
  return { state, instance, create: vi.fn(() => instance), post: vi.fn() };
});
vi.mock('axios', () => ({ default: { create: h.create, post: h.post } }));

import apiClient from './api';
import { AUTH_REQUIRED_EVENT } from '../constants/events';

const memStore = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => (memStore.has(k) ? memStore.get(k)! : null),
  setItem: (k: string, v: string) => { memStore.set(k, String(v)); },
  removeItem: (k: string) => { memStore.delete(k); },
  clear: () => memStore.clear(),
});

beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });

describe('api client', () => {
  it('creates axios instance with defaults', () => {
    expect(apiClient).toBe(h.instance);
  });

  it('request interceptor adds bearer token when present', async () => {
    const [ok, err] = h.state.req!;
    expect(ok({ headers: {} }).headers.Authorization).toBeUndefined();
    localStorage.setItem('accessToken', 't');
    expect(ok({ headers: {} }).headers.Authorization).toBe('Bearer t');
    await expect(err('e')).rejects.toBe('e');
  });

  it('response success passes through', () => {
    expect(h.state.res![0]('r')).toBe('r');
  });

  it('non-401 errors are rejected', async () => {
    const e = { config: {}, response: { status: 500 } };
    await expect(h.state.res![1](e)).rejects.toBe(e);
  });

  it('401 with refresh token refreshes and retries', async () => {
    localStorage.setItem('refreshToken', 'rt');
    h.post.mockResolvedValue({ data: { token: 'new' } });
    h.instance.mockResolvedValue('retried');
    const cfg: any = {};
    await expect(h.state.res![1]({ config: cfg, response: { status: 401 } })).resolves.toBe('retried');
    expect(cfg._retry).toBe(true);
    expect(localStorage.getItem('accessToken')).toBe('new');
    expect(h.post).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/refresh$/), { refreshToken: 'rt' }, { timeout: 10000 });
  });

  it('401 without refresh token rejects without refreshing', async () => {
    const e = { config: {}, response: { status: 401 } };
    await expect(h.state.res![1](e)).rejects.toBe(e);
    expect(h.post).not.toHaveBeenCalled();
  });

  it('already-retried 401 rejects', async () => {
    const e = { config: { _retry: true }, response: { status: 401 } };
    await expect(h.state.res![1](e)).rejects.toBe(e);
  });

  it('failed refresh clears tokens and fires auth event', async () => {
    localStorage.setItem('refreshToken', 'rt');
    localStorage.setItem('accessToken', 'old');
    h.post.mockRejectedValue(new Error('nope'));
    const listener = vi.fn();
    window.addEventListener(AUTH_REQUIRED_EVENT, listener);
    const e = { config: {}, response: { status: 401 } };
    await expect(h.state.res![1](e)).rejects.toBe(e);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(listener).toHaveBeenCalled();
    window.removeEventListener(AUTH_REQUIRED_EVENT, listener);
  });
});
