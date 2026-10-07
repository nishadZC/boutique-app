import { describe, it, expect, vi, beforeEach } from 'vitest';

const client = { query: vi.fn(), release: vi.fn() };
vi.mock('../database/connection', () => ({
  query: vi.fn(),
  getPool: () => ({ connect: async () => client }),
}));
vi.mock('../clients/productClient', () => ({
  getProducts: vi.fn(),
  commitStock: vi.fn(),
}));

import { query } from '../database/connection';
import { commitStock, getProducts } from '../clients/productClient';
import {
  OrderError, formatOrder, formatRequest, getRequests, getOrderItems, withProducts, getEvents,
  changePaymentStatus, changeOrderStatus, customerCancel, requestReturn, rejectRequest, recordEvent,
} from './orderService';

const mq = vi.mocked(query);
const mCommit = vi.mocked(commitStock);
const mGetProducts = vi.mocked(getProducts);
const ORDER = '33333333-3333-4333-8333-333333333333';
const USER = '11111111-1111-4111-8111-111111111111';
const PRODUCT = '22222222-2222-4222-8222-222222222222';

/** Fake transaction client: dispatches by SQL text. */
function tx(locked: any, handlers: Record<string, any> = {}) {
  client.query.mockImplementation(async (sql: string) => {
    if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return {};
    if (sql.includes('FOR UPDATE')) return { rows: locked ? [locked] : [] };
    for (const [k, v] of Object.entries(handlers)) if (sql.includes(k)) return typeof v === 'function' ? v() : v;
    return { rows: [] };
  });
}
const sqls = () => client.query.mock.calls.map(c => c[0] as string);

/** Pool-level query: order row reads + item reads. */
function pool(order: any, items: any[] = []) {
  mq.mockImplementation(async (sql: string) => {
    if (sql.includes('FROM order_items')) return { rows: items } as any;
    if (sql.includes('SELECT * FROM orders')) return { rows: [order] } as any;
    return { rows: [] } as any;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  client.query.mockReset();
  mq.mockReset();
  mCommit.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('formatters', () => {
  it('formats a legacy order row', () => {
    const o = formatOrder({ id: 'x', status: 'processing', total_amount: '50', shipping_address: '{"address":"a"}' });
    expect(o).toMatchObject({ status: 'confirmed', totalAmount: 50, subtotalAmount: 50, shippingAmount: 0, taxAmount: 0, shippingAddress: { address: 'a' }, stockCommitted: false });
  });
  it('keeps unparsable or plain addresses', () => {
    expect(formatOrder({ shipping_address: '{bad' }).shippingAddress).toBe('{bad');
    expect(formatOrder({ shipping_address: 'plain', subtotal_amount: '3', shipping_amount: '1', tax_amount: '2' }))
      .toMatchObject({ shippingAddress: 'plain', subtotalAmount: 3, shippingAmount: 1, taxAmount: 2 });
  });
  it('formats requests with defaults', () => {
    expect(formatRequest({ id: 'r', type: 'return' })).toMatchObject({ details: '', resolutionNote: '' });
  });
});

describe('read helpers', () => {
  it('returns empty maps without querying for no ids', async () => {
    expect((await getRequests([])).size).toBe(0);
    expect((await getOrderItems([])).size).toBe(0);
    expect(mq).not.toHaveBeenCalled();
  });
  it('groups requests and items by order', async () => {
    mq.mockResolvedValueOnce({ rows: [{ order_id: 'a', id: 1 }, { order_id: 'a', id: 2 }, { order_id: 'b', id: 3 }] } as any);
    const r = await getRequests(['a', 'b']);
    expect(r.get('a')).toHaveLength(2);
    mq.mockResolvedValueOnce({ rows: [{ order_id: 'a', id: 1, product_id: 'p', quantity: 2, price: '9.5', size: 'M' }, { order_id: 'a', id: 2, product_id: 'q', quantity: 1, price: '1', size: null }] } as any);
    const i = await getOrderItems(['a']);
    expect(i.get('a')![0]).toEqual({ id: 1, productId: 'p', quantity: 2, price: 9.5, size: 'M' });
    expect(i.get('a')).toHaveLength(2);
  });
  it('attaches products or a placeholder', async () => {
    mGetProducts.mockResolvedValueOnce(new Map([['p', { id: 'p', name: 'Shirt', imageUrl: 'i', category: 'c', brand: 'b' } as any]]));
    const out = await withProducts([{ productId: 'p' }, { productId: 'gone' }]);
    expect(out[0].product.name).toBe('Shirt');
    expect(out[1].product).toEqual({ id: 'gone', name: 'Unavailable product', imageUrl: '', category: '', brand: '' });
  });
  it('maps events with defaults', async () => {
    mq.mockResolvedValueOnce({ rows: [{ type: 't', from_value: null, to_value: 'x', note: null, actor: null, created_at: 'd' }] } as any);
    expect(await getEvents(ORDER)).toEqual([{ type: 't', fromValue: null, toValue: 'x', note: '', actor: '', createdAt: 'd' }]);
  });
  it('recordEvent defaults note', async () => {
    const db = { query: vi.fn() };
    await recordEvent(db as any, ORDER, 't', null, null, 'me');
    expect(db.query.mock.calls[0][1]).toEqual([ORDER, 't', null, null, '', 'me']);
  });
});

describe('changePaymentStatus', () => {
  it('404s and rolls back for a missing order', async () => {
    tx(null);
    await expect(changePaymentStatus(ORDER, 'paid', 'a')).rejects.toMatchObject({ status: 404 });
    expect(sqls()).toContain('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
  it('is a no-op when unchanged', async () => {
    tx({ id: ORDER, payment_status: 'paid', status: 'confirmed' });
    pool({ id: ORDER, payment_status: 'paid', status: 'confirmed', total_amount: '1' });
    const o = await changePaymentStatus(ORDER, 'paid', 'a');
    expect(o.paymentStatus).toBe('paid');
    expect(sqls()).toContain('COMMIT');
    expect(mCommit).not.toHaveBeenCalled();
  });
  it('rejects disallowed transitions', async () => {
    tx({ id: ORDER, payment_status: 'refunded', status: 'cancelled' });
    await expect(changePaymentStatus(ORDER, 'paid', 'a')).rejects.toThrow('Payment cannot go from refunded to paid');
  });
  it('refuses to pay a cancelled order', async () => {
    tx({ id: ORDER, payment_status: 'pending', status: 'cancelled' });
    const err = await changePaymentStatus(ORDER, 'paid', 'a').catch(e => e);
    expect(err).toBeInstanceOf(OrderError);
    expect(err.status).toBe(409);
  });
  it('marks paid, confirms, and commits stock with shortages logged', async () => {
    tx({ id: ORDER, payment_status: 'pending', status: 'pending' }, {
      'UPDATE orders SET': { rows: [{ id: ORDER, status: 'confirmed', payment_status: 'paid', stock_committed: false }] },
    });
    pool({ id: ORDER, status: 'confirmed', payment_status: 'paid', total_amount: '10' }, [{ order_id: ORDER, id: 1, product_id: PRODUCT, quantity: 2, price: '5' }]);
    mCommit.mockResolvedValueOnce({ shortages: [{ productId: PRODUCT, requested: 2, available: 1 }] });
    const o = await changePaymentStatus(ORDER, 'paid', 'svc', { paymentId: 'pay_1' });
    expect(o.status).toBe('confirmed');
    const upd = client.query.mock.calls.find(c => String(c[0]).startsWith('UPDATE orders'))!;
    expect(upd[0]).toContain("status = 'confirmed'");
    expect(upd[1]).toEqual(['paid', 'pay_1', ORDER]);
    expect(mCommit).toHaveBeenCalledWith(ORDER, 'sale', [{ productId: PRODUCT, quantity: 2 }]);
    const evt = mq.mock.calls.find(c => String(c[0]).includes('order_events'))!;
    expect(evt[1]).toContain('Oversold: 2 requested, 1 available');
  });
  it('paid without paymentId on a failed order, no items to sync', async () => {
    tx({ id: ORDER, payment_status: 'failed', status: 'confirmed' }, {
      'UPDATE orders SET': { rows: [{ id: ORDER, status: 'confirmed', stock_committed: false }] },
    });
    pool({ id: ORDER, status: 'confirmed', payment_status: 'paid' }, []);
    await changePaymentStatus(ORDER, 'paid', 'svc');
    expect(mCommit).not.toHaveBeenCalled();
  });
  it('refund cancels, settles requests and restocks; stock failure is logged', async () => {
    tx({ id: ORDER, payment_status: 'paid', status: 'packed' }, {
      'UPDATE orders SET': { rows: [{ id: ORDER, status: 'cancelled', stock_committed: true }] },
    });
    pool({ id: ORDER, status: 'cancelled', payment_status: 'refunded' }, [{ order_id: ORDER, product_id: PRODUCT, quantity: 1, price: '1' }]);
    mCommit.mockRejectedValueOnce(new Error('down'));
    await changePaymentStatus(ORDER, 'refunded', 'admin', { refundId: 'rfnd_1' });
    const s = sqls();
    expect(s.some(q => q.includes("UPDATE order_requests SET status = 'refunded'"))).toBe(true);
    const evts = client.query.mock.calls.filter(c => String(c[0]).includes('order_events'));
    expect(evts[0][1]).toContain('Razorpay refund rfnd_1');
    expect(evts[1][1]).toEqual([ORDER, 'status', 'packed', 'cancelled', '', 'admin']);
    expect(mq.mock.calls.some(c => (c[1] as any[])?.includes('stock_sync_failed'))).toBe(true);
  });
  it('refund of a delivered order keeps status, no restock when not committed', async () => {
    tx({ id: ORDER, payment_status: 'paid', status: 'delivered' }, {
      'UPDATE orders SET': { rows: [{ id: ORDER, status: 'delivered', stock_committed: false }] },
    });
    pool({ id: ORDER, status: 'delivered', payment_status: 'refunded' });
    await changePaymentStatus(ORDER, 'refunded', 'admin', { note: 'n' });
    expect(mCommit).not.toHaveBeenCalled();
  });
});

describe('changeOrderStatus', () => {
  it('409s an invalid transition', async () => {
    tx({ id: ORDER, status: 'delivered', payment_status: 'paid' });
    await expect(changeOrderStatus(ORDER, 'packed', 'a')).rejects.toMatchObject({ status: 409 });
  });
  it('cancels a paid order, restocks and flags refund', async () => {
    tx({ id: ORDER, status: 'confirmed', payment_status: 'paid' }, {
      'UPDATE orders SET': { rows: [{ id: ORDER, status: 'cancelled', stock_committed: true }] },
    });
    pool({ id: ORDER, status: 'cancelled', payment_status: 'paid' }, [{ order_id: ORDER, product_id: PRODUCT, quantity: 1, price: '1' }]);
    mCommit.mockResolvedValueOnce({ shortages: [] });
    const r = await changeOrderStatus(ORDER, 'cancelled', 'a', 'why');
    expect(r).toMatchObject({ refundRequired: true, message: 'Order marked cancelled' });
    expect(mCommit).toHaveBeenCalledWith(ORDER, 'restock', expect.any(Array));
  });
  it('advances fulfilment', async () => {
    tx({ id: ORDER, status: 'packed', payment_status: 'paid' }, {
      'UPDATE orders SET': { rows: [{ id: ORDER, status: 'shipped', stock_committed: true }] },
    });
    pool({ id: ORDER, status: 'shipped', payment_status: 'paid' });
    const r = await changeOrderStatus(ORDER, 'shipped', 'a');
    expect(r).toMatchObject({ refundRequired: false, message: 'Order marked shipped' });
  });
});

describe('customerCancel', () => {
  it('hides other users orders', async () => {
    tx({ id: ORDER, user_id: 'other', status: 'pending' });
    await expect(customerCancel(ORDER, USER, 'a', 'r', '')).rejects.toMatchObject({ status: 404 });
  });
  it('409s a delivered order', async () => {
    tx({ id: ORDER, user_id: USER, status: 'delivered' });
    await expect(customerCancel(ORDER, USER, 'a', 'r', '')).rejects.toMatchObject({ status: 409 });
  });
  it('cancels an unpaid order with a closed request', async () => {
    tx({ id: ORDER, user_id: USER, status: 'pending', payment_status: 'pending' }, {
      'UPDATE orders': { rows: [{ id: ORDER, status: 'cancelled', stock_committed: false }] },
    });
    pool({ id: ORDER, status: 'cancelled', payment_status: 'pending' });
    const o = await customerCancel(ORDER, USER, 'a', 'changed mind', '');
    expect(o.status).toBe('cancelled');
    const ins = client.query.mock.calls.find(c => String(c[0]).includes('INSERT INTO order_requests'))!;
    expect(ins[1][3]).toBeNull();
    expect(ins[1][4]).toBe('closed');
  });
  it('cancels a paid order with a pending request and restocks', async () => {
    tx({ id: ORDER, user_id: USER, status: 'confirmed', payment_status: 'paid' }, {
      'UPDATE orders': { rows: [{ id: ORDER, status: 'cancelled', stock_committed: true }] },
    });
    pool({ id: ORDER, status: 'cancelled', payment_status: 'paid' }, [{ order_id: ORDER, product_id: PRODUCT, quantity: 1, price: '1' }]);
    mCommit.mockResolvedValueOnce({ shortages: [] });
    await customerCancel(ORDER, USER, 'a', 'reason', 'more');
    const ins = client.query.mock.calls.find(c => String(c[0]).includes('INSERT INTO order_requests'))!;
    expect(ins[1].slice(3)).toEqual(['more', 'pending', null]);
    expect(mCommit).toHaveBeenCalled();
  });
});

describe('requestReturn', () => {
  const now = new Date().toISOString();
  it('hides other users orders', async () => {
    tx({ id: ORDER, user_id: 'x' });
    await expect(requestReturn(ORDER, USER, 'a', 'return', 'r', '')).rejects.toMatchObject({ status: 404 });
  });
  it('409s when not delivered', async () => {
    tx({ id: ORDER, user_id: USER, status: 'shipped', payment_status: 'paid', updated_at: null });
    await expect(requestReturn(ORDER, USER, 'a', 'return', 'r', '')).rejects.toMatchObject({ status: 409 });
  });
  it('409s when a request is already open', async () => {
    tx({ id: ORDER, user_id: USER, status: 'delivered', payment_status: 'paid', updated_at: now }, {
      "status = 'pending'": { rows: [{ 1: 1 }] },
    });
    await expect(requestReturn(ORDER, USER, 'a', 'return', 'r', '')).rejects.toThrow('already being reviewed');
  });
  it('creates a request', async () => {
    tx({ id: ORDER, user_id: USER, status: 'delivered', payment_status: 'paid' }, {
      "to_value = 'delivered'": { rows: [{ created_at: now }] },
    });
    mq.mockImplementation(async (sql: string) => {
      if (sql.includes('order_requests')) return { rows: [{ order_id: ORDER, id: 'r1', type: 'refund' }] } as any;
      return { rows: [{ id: ORDER, status: 'delivered' }] } as any;
    });
    const o = await requestReturn(ORDER, USER, 'a', 'refund', 'damaged', '');
    expect(o.requests).toHaveLength(1);
    expect(sqls().some(q => q.includes('INSERT INTO order_requests'))).toBe(true);
  });
});

describe('rejectRequest', () => {
  it('404s with no pending request', async () => {
    tx({ id: ORDER });
    await expect(rejectRequest(ORDER, 'r', 'a', 'n')).rejects.toMatchObject({ status: 404 });
  });
  it('refuses to reject a cancellation', async () => {
    tx({ id: ORDER }, { 'FROM order_requests': { rows: [{ type: 'cancel' }] } });
    await expect(rejectRequest(ORDER, 'r', 'a', 'n')).rejects.toMatchObject({ status: 409 });
  });
  it('rejects a return request', async () => {
    tx({ id: ORDER }, { 'SELECT * FROM order_requests': { rows: [{ type: 'return' }] } });
    mq.mockImplementation(async (sql: string) => (sql.includes('order_requests') ? { rows: [] } : { rows: [{ id: ORDER }] }) as any);
    const o = await rejectRequest(ORDER, 'r', 'a', 'no');
    expect(o.requests).toEqual([]);
    expect(sqls().some(q => q.includes("status = 'rejected'"))).toBe(true);
  });
});
