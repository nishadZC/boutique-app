import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { randomBytes } from 'crypto';

const client = { query: vi.fn(), release: vi.fn() };
vi.mock('../database/connection', () => ({ query: vi.fn(), getPool: () => ({ connect: async () => client }) }));
import { internalRoutes } from './internal';

const TOKEN = randomBytes(24).toString('hex');
process.env.INTERNAL_API_TOKEN = TOKEN;
const app = express();
app.use(express.json());
app.use('/internal', internalRoutes);
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const ORDER = '33333333-3333-4333-8333-333333333333';
const post = (body: object) => request(app).post('/internal/inventory/commit').set('x-internal-token', TOKEN).send(body);

beforeEach(() => { client.query.mockReset(); client.release.mockReset(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

describe('internal inventory commit', () => {
  it('400 on invalid body', async () => expect((await post({ direction: 'x' })).status).toBe(400));
  it('restocks, skips unknown and zero-stock items', async () => {
    client.query.mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.startsWith('SELECT')) return params![0] === A ? { rows: [] } : { rows: [{ inventory_quantity: null }] };
      return {};
    });
    const res = await post({ orderId: ORDER, direction: 'restock', items: [{ productId: B, quantity: 2 }, { productId: A, quantity: 1 }] });
    expect(res.body.data.shortages).toEqual([]);
    const selects = client.query.mock.calls.filter(c => String(c[0]).startsWith('SELECT')).map(c => c[1][0]);
    expect(selects).toEqual([A, B]);
    const adj = client.query.mock.calls.find(c => String(c[0]).includes('inventory_adjustments'));
    expect(adj?.[1]).toEqual([B, 2, 2, 'order_restock', 'Order cancelled or refunded', ORDER]);
  });
  it('sale of zero stock records shortage and skips update', async () => {
    client.query.mockImplementation(async (sql: string) => sql.startsWith('SELECT') ? { rows: [{ inventory_quantity: 0 }] } : {});
    const res = await post({ orderId: ORDER, direction: 'sale', items: [{ productId: B, quantity: 1 }] });
    expect(res.body.data.shortages).toEqual([{ productId: B, requested: 1, available: 0 }]);
    expect(client.query.mock.calls.some(c => String(c[0]).startsWith('UPDATE'))).toBe(false);
  });
  it('rolls back on error', async () => {
    client.query.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('x')).mockResolvedValue({});
    const res = await post({ orderId: ORDER, direction: 'sale', items: [{ productId: B, quantity: 1 }] });
    expect(res.status).toBe(500);
    expect(client.query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});
