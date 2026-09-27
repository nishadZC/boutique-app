// Order persistence and state changes shared by the customer, admin and
// internal routers. State changes lock the order row so concurrent requests
// (e.g. a payment callback racing an admin action) cannot double-apply.
import type { PoolClient } from 'pg';
import { getPool, query } from '../database/connection';
import { canChangePayment, canCustomerCancel, canRequestReturn, canTransition, label } from '../lifecycle';
import { commitStock, getProducts } from '../clients/productClient';

export class OrderError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export interface OrderEvent {
  type: string;
  fromValue: string | null;
  toValue: string | null;
  note: string;
  actor: string;
  createdAt: string;
}

const parseAddress = (raw: unknown) => {
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try { return JSON.parse(raw); } catch { /* keep raw */ }
  }
  return raw;
};

export function formatOrder(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status === 'processing' ? 'confirmed' : row.status,
    paymentStatus: row.payment_status,
    totalAmount: Number(row.total_amount),
    // Orders created before the price breakdown existed carry only a total.
    subtotalAmount: row.subtotal_amount == null ? Number(row.total_amount) : Number(row.subtotal_amount),
    shippingAmount: Number(row.shipping_amount ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
    shippingAddress: parseAddress(row.shipping_address),
    paidAt: row.paid_at,
    stockCommitted: !!row.stock_committed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function formatRequest(row: any) {
  return {
    id: row.id,
    type: row.type,
    reason: row.reason,
    details: row.details ?? '',
    status: row.status,
    resolutionNote: row.resolution_note ?? '',
    refundId: row.refund_id,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
  };
}

/** Cancellation/return requests per order, newest first. */
export async function getRequests(orderIds: string[]) {
  const byOrder = new Map<string, ReturnType<typeof formatRequest>[]>();
  if (orderIds.length === 0) return byOrder;
  const result = await query(
    'SELECT * FROM order_requests WHERE order_id = ANY($1::uuid[]) ORDER BY created_at DESC', [orderIds]);
  for (const r of result.rows) {
    const list = byOrder.get(r.order_id) ?? [];
    list.push(formatRequest(r));
    byOrder.set(r.order_id, list);
  }
  return byOrder;
}

export async function recordEvent(
  db: Pick<PoolClient, 'query'> | { query: typeof query },
  orderId: string, type: string, fromValue: string | null, toValue: string | null, actor: string, note = '',
) {
  await db.query(
    'INSERT INTO order_events (order_id, type, from_value, to_value, note, actor) VALUES ($1, $2, $3, $4, $5, $6)',
    [orderId, type, fromValue, toValue, note, actor]);
}

export async function getOrderItems(orderIds: string[]) {
  if (orderIds.length === 0) return new Map<string, any[]>();
  const result = await query(
    'SELECT id, order_id, product_id, quantity, price, size FROM order_items WHERE order_id = ANY($1::uuid[]) ORDER BY created_at',
    [orderIds]);
  const byOrder = new Map<string, any[]>();
  for (const r of result.rows) {
    const list = byOrder.get(r.order_id) ?? [];
    list.push({ id: r.id, productId: r.product_id, quantity: r.quantity, price: Number(r.price), size: r.size });
    byOrder.set(r.order_id, list);
  }
  return byOrder;
}

/** Items with product name/image, for order history and the admin order page. */
export async function withProducts(items: any[]) {
  const products = await getProducts(items.map(i => i.productId));
  return items.map(item => {
    const p = products.get(item.productId);
    return {
      ...item,
      product: p
        ? { id: p.id, name: p.name, imageUrl: p.imageUrl, category: p.category, brand: p.brand }
        : { id: item.productId, name: 'Unavailable product', imageUrl: '', category: '', brand: '' },
    };
  });
}

export async function getEvents(orderId: string): Promise<OrderEvent[]> {
  const result = await query(
    'SELECT type, from_value, to_value, note, actor, created_at FROM order_events WHERE order_id = $1 ORDER BY created_at, id',
    [orderId]);
  return result.rows.map((r: any) => ({
    type: r.type, fromValue: r.from_value, toValue: r.to_value, note: r.note ?? '', actor: r.actor ?? '', createdAt: r.created_at,
  }));
}

async function withLockedOrder<T>(orderId: string, fn: (client: PoolClient, order: any) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    if (locked.rows.length === 0) throw new OrderError(404, 'Order not found');
    const result = await fn(client, locked.rows[0]);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Keeps stock in step with an order: deduct once when paid, return it when
 * the order is cancelled or refunded. Runs after the order transaction commits;
 * a failure is logged on the order so an admin can see it, never lost silently.
 */
async function syncStock(orderId: string, direction: 'sale' | 'restock') {
  const items = (await getOrderItems([orderId])).get(orderId) ?? [];
  if (items.length === 0) return;
  try {
    const { shortages } = await commitStock(orderId, direction, items.map(i => ({ productId: i.productId, quantity: i.quantity })));
    await query('UPDATE orders SET stock_committed = $1 WHERE id = $2', [direction === 'sale', orderId]);
    if (shortages.length) {
      await recordEvent({ query }, orderId, 'stock_shortage', null, null, 'system',
        `Oversold: ${shortages.map(s => `${s.requested} requested, ${s.available} available`).join('; ')}`);
    }
  } catch (error) {
    console.error(`Stock ${direction} failed for order ${orderId}:`, error);
    await recordEvent({ query }, orderId, 'stock_sync_failed', null, direction, 'system', 'Stock was not updated; adjust inventory manually');
  }
}

export async function changePaymentStatus(
  orderId: string, to: string, actor: string, opts: { paymentId?: string; refundId?: string; note?: string } = {},
) {
  const outcome = await withLockedOrder(orderId, async (client, order) => {
    const from = order.payment_status;
    if (from === to) return { order, changed: false };
    if (!canChangePayment(from, to)) throw new OrderError(409, `Payment cannot go from ${from} to ${to}`);
    if (to === 'paid' && order.status === 'cancelled') throw new OrderError(409, 'This order was cancelled and can no longer be paid');

    const updates = ['payment_status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [to];
    if (to === 'paid') {
      updates.push('paid_at = CURRENT_TIMESTAMP');
      if (opts.paymentId) { params.push(opts.paymentId); updates.push(`razorpay_payment_id = $${params.length}`); }
      if (order.status === 'pending') updates.push("status = 'confirmed'");
    }
    if (to === 'refunded' && ['pending', 'confirmed', 'packed', 'processing'].includes(order.status)) {
      updates.push("status = 'cancelled'");
    }
    params.push(orderId);
    const updated = await client.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    await recordEvent(client, orderId, 'payment_status', from, to, actor, opts.note ?? (opts.refundId ? `Razorpay refund ${opts.refundId}` : ''));
    if (to === 'refunded') {
      // A refund settles whatever the customer asked for (cancellation or return).
      await client.query(
        `UPDATE order_requests SET status = 'refunded', refund_id = $1, resolution_note = $2, resolved_by = $3, resolved_at = CURRENT_TIMESTAMP
         WHERE order_id = $4 AND status = 'pending'`,
        [opts.refundId ?? null, opts.note ?? '', actor, orderId]);
    }
    if (updated.rows[0].status !== order.status) {
      await recordEvent(client, orderId, 'status', order.status, updated.rows[0].status, actor);
    }
    return { order: updated.rows[0], changed: true };
  });

  if (outcome.changed) {
    if (to === 'paid' && !outcome.order.stock_committed) await syncStock(orderId, 'sale');
    if (to === 'refunded' && outcome.order.stock_committed) await syncStock(orderId, 'restock');
  }
  return formatOrder((await query('SELECT * FROM orders WHERE id = $1', [orderId])).rows[0]);
}

export async function changeOrderStatus(orderId: string, to: string, actor: string, note = '') {
  const outcome = await withLockedOrder(orderId, async (client, order) => {
    const check = canTransition(order.status, to, order.payment_status);
    if (!check.ok) throw new OrderError(409, check.reason);
    const updated = await client.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [to, orderId]);
    await recordEvent(client, orderId, 'status', order.status, to, actor, note);
    return updated.rows[0];
  });

  if (to === 'cancelled' && outcome.stock_committed) await syncStock(orderId, 'restock');
  const order = formatOrder((await query('SELECT * FROM orders WHERE id = $1', [orderId])).rows[0]);
  return {
    order,
    // A paid order that is cancelled still needs its money returned in Razorpay.
    refundRequired: to === 'cancelled' && order.paymentStatus === 'paid',
    message: `Order marked ${label(to)}`,
  };
}

/** The customer cancels their own order before delivery; a paid order then waits for an admin refund. */
export async function customerCancel(orderId: string, userId: string, actor: string, reason: string, details: string) {
  const outcome = await withLockedOrder(orderId, async (client, order) => {
    if (order.user_id !== userId) throw new OrderError(404, 'Order not found');
    const check = canCustomerCancel(order.status);
    if (!check.ok) throw new OrderError(409, check.reason);
    const updated = await client.query(
      "UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [orderId]);
    const needsRefund = order.payment_status === 'paid';
    await client.query(
      'INSERT INTO order_requests (order_id, type, reason, details, status, resolved_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [orderId, 'cancel', reason, details || null, needsRefund ? 'pending' : 'closed', needsRefund ? null : new Date()]);
    await recordEvent(client, orderId, 'status', order.status, 'cancelled', actor, `Cancelled by customer: ${reason}`);
    return updated.rows[0];
  });

  if (outcome.stock_committed) await syncStock(orderId, 'restock');
  return formatOrder((await query('SELECT * FROM orders WHERE id = $1', [orderId])).rows[0]);
}

/** The customer asks to return (or be refunded for) a delivered order; an admin approves or rejects it. */
export async function requestReturn(
  orderId: string, userId: string, actor: string, type: 'return' | 'refund', reason: string, details: string,
) {
  await withLockedOrder(orderId, async (client, order) => {
    if (order.user_id !== userId) throw new OrderError(404, 'Order not found');
    const delivered = await client.query(
      `SELECT created_at FROM order_events WHERE order_id = $1 AND type = 'status' AND to_value = 'delivered'
       ORDER BY created_at DESC LIMIT 1`, [orderId]);
    const deliveredAt = delivered.rows[0]?.created_at ?? order.updated_at;
    const check = canRequestReturn(order.status, order.payment_status, deliveredAt ? new Date(deliveredAt) : null);
    if (!check.ok) throw new OrderError(409, check.reason);
    const open = await client.query("SELECT 1 FROM order_requests WHERE order_id = $1 AND status = 'pending'", [orderId]);
    if (open.rows.length) throw new OrderError(409, 'A request for this order is already being reviewed');
    await client.query(
      'INSERT INTO order_requests (order_id, type, reason, details) VALUES ($1, $2, $3, $4)',
      [orderId, type, reason, details || null]);
    await recordEvent(client, orderId, `${type}_requested`, null, null, actor, reason);
  });
  return getOrderWithRequests(orderId);
}

/** An admin turns down a pending return/refund request. Cancellations are refunded, not rejected. */
export async function rejectRequest(orderId: string, requestId: string, actor: string, note: string) {
  await withLockedOrder(orderId, async (client) => {
    const found = await client.query(
      "SELECT * FROM order_requests WHERE id = $1 AND order_id = $2 AND status = 'pending'", [requestId, orderId]);
    const request = found.rows[0];
    if (!request) throw new OrderError(404, 'No pending request to reject');
    if (request.type === 'cancel') throw new OrderError(409, 'The order is already cancelled; refund the customer instead');
    await client.query(
      `UPDATE order_requests SET status = 'rejected', resolution_note = $1, resolved_by = $2, resolved_at = CURRENT_TIMESTAMP
       WHERE id = $3`, [note, actor, requestId]);
    await recordEvent(client, orderId, 'request_rejected', null, request.type, actor, note);
  });
  return getOrderWithRequests(orderId);
}

async function getOrderWithRequests(orderId: string) {
  const order = formatOrder((await query('SELECT * FROM orders WHERE id = $1', [orderId])).rows[0]);
  return { ...order, requests: (await getRequests([orderId])).get(orderId) ?? [] };
}
