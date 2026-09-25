// Customer order routes (gateway: /api/orders).
import express from 'express';
import Joi from 'joi';
import { getPool, query } from '../database/connection';
import { boutiqueTotalOrders } from '../metrics';
import { requireAdmin, requireInternal, requireUser } from '../middleware/auth';
import { getProducts } from '../clients/productClient';
import {
  OrderError, changeOrderStatus, changePaymentStatus, formatOrder, getOrderItems, recordEvent, withProducts,
} from '../services/orderService';
import { PAYMENT_STATUSES } from '../lifecycle';
import { priceOrder } from '../pricing';

const router = express.Router();

export const MAX_QUANTITY_PER_ITEM = 10;

export const createOrderSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    productId: Joi.string().guid().required(),
    quantity: Joi.number().integer().min(1).max(MAX_QUANTITY_PER_ITEM).required(),
    selectedSize: Joi.string().trim().max(200).allow('', null),
  })).min(1).max(50).required(),
  shippingAddress: Joi.object({
    address: Joi.string().trim().min(5).max(500).required(),
  }).required(),
});

const sendError = (res: express.Response, error: unknown, fallback: string) => {
  if (error instanceof OrderError) return res.status(error.status).json({ success: false, error: error.message });
  console.error(fallback, error);
  return res.status(500).json({ success: false, error: fallback });
};

router.post('/', requireUser, async (req, res) => {
  const { value, error } = createOrderSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, error: error.details.map(d => d.message.replace(/"/g, '')).join('; ') });

  let products;
  try {
    products = await getProducts(value.items.map((i: any) => i.productId));
  } catch (err) {
    console.error('Product lookup failed during checkout:', err);
    return res.status(502).json({ success: false, error: 'Could not verify products, please try again' });
  }

  // Prices always come from the catalogue, never from the client.
  const requested = new Map<string, number>();
  for (const item of value.items) requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
  for (const [productId, quantity] of requested) {
    const product = products.get(productId);
    if (!product || !product.isActive) return res.status(409).json({ success: false, error: 'An item in your cart is no longer available' });
    if (product.inventoryQuantity < quantity) {
      return res.status(409).json({
        success: false,
        error: product.inventoryQuantity === 0
          ? `${product.name} is out of stock`
          : `Only ${product.inventoryQuantity} of ${product.name} left in stock`,
      });
    }
  }
  const lines = value.items.map((item: any) => ({ ...item, price: products.get(item.productId)!.price }));
  const pricing = priceOrder(lines);

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const created = await client.query(
      `INSERT INTO orders (user_id, total_amount, subtotal_amount, shipping_amount, tax_amount, status, shipping_address, payment_status)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, 'pending') RETURNING *`,
      [req.auth!.userId, pricing.total, pricing.subtotal, pricing.shipping, pricing.tax, JSON.stringify(value.shippingAddress)]);
    const order = created.rows[0];
    for (const line of lines) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, size) VALUES ($1, $2, $3, $4, $5)',
        [order.id, line.productId, line.quantity, line.price, line.selectedSize || null]);
    }
    await recordEvent(client, order.id, 'created', null, 'pending', req.auth!.email ?? req.auth!.userId);
    await client.query('COMMIT');
    boutiqueTotalOrders.inc(1);

    const items = (await getOrderItems([order.id])).get(order.id) ?? [];
    return res.status(201).json({ success: true, data: { ...formatOrder(order), items } });
  } catch (err) {
    await client.query('ROLLBACK');
    return sendError(res, err, 'Failed to create order');
  } finally {
    client.release();
  }
});

router.get('/my-orders', requireUser, async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200', [req.auth!.userId]);
    const orderIds = result.rows.map((o: any) => o.id);
    const itemsByOrder = await getOrderItems(orderIds);
    const events = orderIds.length
      ? await query(
        `SELECT order_id, to_value, created_at FROM order_events
         WHERE order_id = ANY($1::uuid[]) AND type IN ('created', 'status') ORDER BY created_at`, [orderIds])
      : { rows: [] };

    const orders = await Promise.all(result.rows.map(async (row: any) => {
      const order = formatOrder(row);
      const timeline = events.rows
        .filter((e: any) => e.order_id === row.id)
        .map((e: any) => ({ status: e.to_value === 'processing' ? 'confirmed' : e.to_value, at: e.created_at }));
      return { ...order, items: await withProducts(itemsByOrder.get(row.id) ?? []), timeline };
    }));
    return res.json({ success: true, data: orders });
  } catch (err) {
    return sendError(res, err, 'Failed to get orders');
  }
});

// Kept for compatibility; fulfilment normally goes through /admin/orders/:id/status.
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { error } = Joi.string().guid().validate(req.params.id);
  if (error) return res.status(404).json({ success: false, error: 'Order not found' });
  try {
    const result = await changeOrderStatus(req.params.id, String(req.body?.status ?? ''), req.auth!.email ?? req.auth!.userId, String(req.body?.note ?? '').slice(0, 500));
    return res.json({ success: true, data: result.order, refundRequired: result.refundRequired });
  } catch (err) {
    return sendError(res, err, 'Failed to update order status');
  }
});

// Called by the payment service after verifying a Razorpay signature.
router.patch('/:id/payment-status', requireInternal, async (req, res) => {
  const { error } = Joi.string().guid().validate(req.params.id);
  if (error) return res.status(404).json({ success: false, error: 'Order not found' });
  const { paymentStatus, paymentId } = req.body ?? {};
  if (!PAYMENT_STATUSES.includes(paymentStatus)) return res.status(400).json({ success: false, error: 'Invalid payment status' });
  try {
    const order = await changePaymentStatus(req.params.id, paymentStatus, 'payment-service', { paymentId: typeof paymentId === 'string' ? paymentId : undefined });
    return res.json({ success: true, data: order });
  } catch (err) {
    return sendError(res, err, 'Failed to update payment status');
  }
});

export { router as orderRoutes, sendError };
