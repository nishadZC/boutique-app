import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

const KEYS = ['PORT', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'ORDERS_SERVICE_URL', 'INTERNAL_API_TOKEN'];
let saved: Record<string, string | undefined>;
const secret = crypto.randomBytes(16).toString('hex');
const token = crypto.randomBytes(16).toString('hex');
const setRequired = () => Object.assign(process.env, {
  RAZORPAY_KEY_ID: 'rzp_id', RAZORPAY_KEY_SECRET: secret, INTERNAL_API_TOKEN: token,
});

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map(k => [k, process.env[k]]));
  KEYS.forEach(k => delete process.env[k]);
  vi.resetModules();
});
afterEach(() => KEYS.forEach(k => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]))));

describe('config', () => {
  it('applies defaults', async () => {
    setRequired();
    const { config } = await import('./index');
    expect(config).toEqual({
      port: 3006, razorpayKeyId: 'rzp_id', razorpayKeySecret: secret, ordersServiceUrl: 'http://localhost:3005', internalApiToken: token,
    });
  });

  it('honours overrides', async () => {
    setRequired();
    Object.assign(process.env, { PORT: '4000', ORDERS_SERVICE_URL: 'http://o' });
    const { config } = await import('./index');
    expect(config).toMatchObject({ port: 4000, ordersServiceUrl: 'http://o' });
  });

  it.each(['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'INTERNAL_API_TOKEN'])('throws when %s is missing', async (name) => {
    setRequired();
    delete process.env[name];
    await expect(import('./index')).rejects.toThrow(`${name} is required`);
  });
});
