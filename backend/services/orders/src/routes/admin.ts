// Admin order management and business KPIs, mounted at /admin
// (gateway: /api/orders/admin/...). Every route requires an admin token.
import express from 'express';
import Joi from 'joi';
import { query } from '../database/connection';
import { requireAdmin } from '../middleware/auth';
import { getProducts } from '../clients/productClient';
import { ORDER_STATUSES, PAYMENT_STATUSES, nextStatus } from '../lifecycle';
import { changeOrderStatus, changePaymentStatus, formatOrder, getEvents, getOrderItems, withProducts } from '../services/orderService';
import { sendError } from './orders';

const router = express.Router();
router.use(requireAdmin);

const actorOf = (req: express.Request) => req.auth?.email ?? req.auth?.userId ?? 'admin';
const guid = Joi.string().guid();

const listSchema = Joi.object({
  status: Joi.string().valid(...ORDER_STATUSES, 'awaiting_fulfilment', 'in_transit'),
  paymentStatus: Joi.string().valid(...PAYMENT_STATUSES),
  search: Joi.string().trim().max(64).allow(''),
  userId: guid,
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
});

router.get('/orders', async (req, res) => {
  const { value, error } = listSchema.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, error: error.message });

  const conditions: string[] = [];
  const params: any[] = [];
  const add = (sql: (n: string) => string, v: unknown) => { params.push(v); conditions.push(sql(`$${params.length}`)); };
  if (value.status === 'awaiting_fulfilment') conditions.push("o.status IN ('confirmed', 'packed', 'processing') AND o.payment_status = 'paid'");
  else if (value.status === 'in_transit') conditions.push("o.status IN ('shipped', 'out_for_delivery')");
  else if (value.status === 'confirmed') conditions.push("o.status IN ('confirmed', 'processing')");
  else if (value.status) add(n => `o.status = ${n}`, value.status);
  if (value.paymentStatus) add(n => `o.payment_status = ${n}`, value.paymentStatus);
  if (value.userId) add(n => `o.user_id = ${n}`, value.userId);
  if (value.search) add(n => `o.id::text ILIKE ${n}`, `${value.search.replace(/[^0-9a-f-]/gi, '')}%`);
  if (value.from) add(n => `o.created_at >= ${n}`, value.from);
  if (value.to) add(n => `o.created_at < ${n}::date + INTERVAL '1 day'`, value.to);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [rows, count] = await Promise.all([
      query(
        `SELECT o.*, (SELECT COALESCE(SUM(quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
         FROM orders o ${where} ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, value.limit, (value.page - 1) * value.limit]),
      query(`SELECT COUNT(*) AS total FROM orders o ${where}`, params),
    ]);
    const total = Number(count.rows[0].total);
    return res.json({
      success: true,
      data: {
        orders: rows.rows.map((r: any) => ({
          ...formatOrder(r),
          itemCount: Number(r.item_count),
          nextStatus: nextStatus(r.status, r.payment_status),
        })),
        pagination: { page: value.page, limit: value.limit, total, totalPages: Math.ceil(total / value.limit) },
      },
    });
  } catch (err) {
    return sendError(res, err, 'Failed to load orders');
  }
});

router.get('/orders/:id', async (req, res) => {
  if (guid.validate(req.params.id).error) return res.status(404).json({ success: false, error: 'Order not found' });
  try {
    const result = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Order not found' });
    const row = result.rows[0];
    const [items, events] = await Promise.all([
      withProducts((await getOrderItems([row.id])).get(row.id) ?? []),
      getEvents(row.id),
    ]);
    return res.json({
      success: true,
      data: {
        ...formatOrder(row),
        razorpayOrderId: row.razorpay_order_id,
        razorpayPaymentId: row.razorpay_payment_id,
        items,
        events,
        nextStatus: nextStatus(row.status, row.payment_status),
      },
    });
  } catch (err) {
    return sendError(res, err, 'Failed to load order');
  }
});

const statusSchema = Joi.object({
  status: Joi.string().valid(...ORDER_STATUSES).required(),
  note: Joi.string().trim().max(500).allow(''),
});

router.patch('/orders/:id/status', async (req, res) => {
  if (guid.validate(req.params.id).error) return res.status(404).json({ success: false, error: 'Order not found' });
  const { value, error } = statusSchema.validate(req.body, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, error: error.message });
  try {
    const result = await changeOrderStatus(req.params.id, value.status, actorOf(req), value.note ?? '');
    return res.json({ success: true, data: result.order, refundRequired: result.refundRequired, message: result.message });
  } catch (err) {
    return sendError(res, err, 'Failed to update order status');
  }
});

// Records a refund made in the Razorpay dashboard (money is not moved from here).
router.post('/orders/:id/refund', async (req, res) => {
  if (guid.validate(req.params.id).error) return res.status(404).json({ success: false, error: 'Order not found' });
  const note = String(req.body?.note ?? '').trim().slice(0, 500);
  if (!note) return res.status(400).json({ success: false, error: 'Add a note with the Razorpay refund reference' });
  try {
    const order = await changePaymentStatus(req.params.id, 'refunded', actorOf(req), { note });
    return res.json({ success: true, data: order });
  } catch (err) {
    return sendError(res, err, 'Failed to record refund');
  }
});

/** Orders placed and paid spend for a set of customers (customers page). */
router.get('/customers/summary', async (req, res) => {
  const ids = String(req.query.userIds ?? '').split(',').filter(id => !guid.validate(id).error).slice(0, 100);
  if (ids.length === 0) return res.json({ success: true, data: {} });
  try {
    const result = await query(
      `SELECT user_id, COUNT(*) AS orders,
              COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0) AS spent,
              MAX(created_at) AS last_order_at
       FROM orders WHERE user_id = ANY($1::uuid[]) GROUP BY user_id`, [ids]);
    const data: Record<string, { orders: number; spent: number; lastOrderAt: string }> = {};
    for (const r of result.rows) data[r.user_id] = { orders: Number(r.orders), spent: Number(r.spent), lastOrderAt: r.last_order_at };
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err, 'Failed to load customer summary');
  }
});

const kpiSchema = Joi.object({ days: Joi.number().integer().valid(7, 30, 90, 365).default(30) });

router.get('/kpis', async (req, res) => {
  const { value, error } = kpiSchema.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, error: 'days must be 7, 30, 90 or 365' });
  const days = value.days;

  try {
    const [current, previous, byDay, pipeline, top] = await Promise.all([
      query(
        `SELECT COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid_orders,
                COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0) AS revenue,
                COUNT(*) AS orders,
                COUNT(*) FILTER (WHERE payment_status = 'failed') AS failed_payments,
                COUNT(DISTINCT user_id) FILTER (WHERE payment_status = 'paid') AS customers
         FROM orders WHERE created_at >= NOW() - ($1 || ' days')::interval`, [days]),
      query(
        `SELECT COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0) AS revenue,
                COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid_orders
         FROM orders WHERE created_at >= NOW() - ($1 * 2 || ' days')::interval
                       AND created_at < NOW() - ($1 || ' days')::interval`, [days]),
      query(
        `SELECT d::date AS day,
                COALESCE(SUM(o.total_amount) FILTER (WHERE o.payment_status = 'paid'), 0) AS revenue,
                COUNT(o.id) FILTER (WHERE o.payment_status = 'paid') AS orders
         FROM generate_series(CURRENT_DATE - ($1 - 1), CURRENT_DATE, INTERVAL '1 day') d
         LEFT JOIN orders o ON o.created_at::date = d::date
         GROUP BY d ORDER BY d`, [days]),
      // Pipeline is "right now", not limited to the period.
      query(
        `SELECT CASE WHEN status = 'processing' THEN 'confirmed' ELSE status END AS status, COUNT(*) AS count
         FROM orders WHERE payment_status = 'paid' OR status IN ('pending', 'cancelled')
         GROUP BY 1`),
      query(
        `SELECT oi.product_id, SUM(oi.quantity) AS units, SUM(oi.quantity * oi.price) AS revenue
         FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE o.payment_status = 'paid' AND o.created_at >= NOW() - ($1 || ' days')::interval
         GROUP BY oi.product_id ORDER BY units DESC, revenue DESC LIMIT 5`, [days]),
    ]);

    const c = current.rows[0];
    const revenue = Number(c.revenue);
    const paidOrders = Number(c.paid_orders);
    const prevRevenue = Number(previous.rows[0].revenue);
    const products = await getProducts(top.rows.map((r: any) => r.product_id)).catch(() => new Map());
    const pipelineCounts = Object.fromEntries(pipeline.rows.map((r: any) => [r.status, Number(r.count)]));

    return res.json({
      success: true,
      data: {
        periodDays: days,
        revenue,
        previousRevenue: prevRevenue,
        revenueChange: prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 1000) / 10 : null,
        paidOrders,
        previousPaidOrders: Number(previous.rows[0].paid_orders),
        totalOrders: Number(c.orders),
        averageOrderValue: paidOrders ? Math.round((revenue / paidOrders) * 100) / 100 : 0,
        conversionRate: Number(c.orders) ? Math.round((paidOrders / Number(c.orders)) * 1000) / 10 : 0,
        failedPayments: Number(c.failed_payments),
        payingCustomers: Number(c.customers),
        pipeline: {
          awaitingPayment: pipelineCounts.pending ?? 0,
          confirmed: pipelineCounts.confirmed ?? 0,
          packed: pipelineCounts.packed ?? 0,
          shipped: pipelineCounts.shipped ?? 0,
          outForDelivery: pipelineCounts.out_for_delivery ?? 0,
          delivered: pipelineCounts.delivered ?? 0,
          cancelled: pipelineCounts.cancelled ?? 0,
        },
        revenueByDay: byDay.rows.map((r: any) => ({ date: r.day, revenue: Number(r.revenue), orders: Number(r.orders) })),
        topProducts: top.rows.map((r: any) => ({
          productId: r.product_id,
          name: products.get(r.product_id)?.name ?? 'Unavailable product',
          imageUrl: products.get(r.product_id)?.imageUrl ?? '',
          units: Number(r.units),
          revenue: Number(r.revenue),
        })),
      },
    });
  } catch (err) {
    return sendError(res, err, 'Failed to load KPIs');
  }
});

export { router as adminRoutes };
