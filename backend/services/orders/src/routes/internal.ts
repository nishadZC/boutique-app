// Service-to-service endpoints (mounted at /internal). Callers must send the
// shared INTERNAL_API_TOKEN; the gateway strips that header from public traffic.
import express from 'express';
import Joi from 'joi';
import { query } from '../database/connection';
import { requireInternal } from '@boutique/shared';
import { sendError } from './orders';
import { requireOrderId, findOrder, orderNotFound } from './orderLookup';

const router = express.Router();
router.use(requireInternal);
const guid = Joi.string().guid();

/** What the payment service needs to create and verify a Razorpay order. */
router.get('/orders/:id', requireOrderId, async (req, res) => {
  try {
    const o = await findOrder(req.params.id);
    if (!o) return orderNotFound(res);
    return res.json({
      success: true,
      data: {
        id: o.id, userId: o.user_id, totalAmount: Number(o.total_amount), status: o.status,
        paymentStatus: o.payment_status, razorpayOrderId: o.razorpay_order_id, razorpayPaymentId: o.razorpay_payment_id,
      },
    });
  } catch (err) {
    return sendError(res, err, 'Failed to load order');
  }
});

/** Binds the Razorpay order created for this order, so a payment can only settle it. */
router.put('/orders/:id/razorpay-order', requireOrderId, async (req, res) => {
  const razorpayOrderId = req.body?.razorpayOrderId;
  if (typeof razorpayOrderId !== 'string' || !/^order_[A-Za-z0-9]{6,40}$/.test(razorpayOrderId)) {
    return res.status(400).json({ success: false, error: 'Invalid Razorpay order id' });
  }
  try {
    const result = await query(
      `UPDATE orders SET razorpay_order_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND payment_status IN ('pending', 'failed') AND status <> 'cancelled' RETURNING id`, [razorpayOrderId, req.params.id]);
    if (result.rowCount === 0) return res.status(409).json({ success: false, error: 'Order is not awaiting payment' });
    return res.json({ success: true });
  } catch (err) {
    return sendError(res, err, 'Failed to bind payment');
  }
});

/** A customer may review a product from one of their delivered orders. */
router.get('/orders/:id/review-eligibility', async (req, res) => {
  const ids = [req.params.id, req.query.userId, req.query.productId];
  if (ids.some(id => guid.validate(id).error)) return res.status(400).json({ success: false, error: 'Invalid ids' });
  try {
    const result = await query(
      `SELECT o.status, o.user_id, EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = $2) AS has_item
       FROM orders o WHERE o.id = $1`, [req.params.id, req.query.productId]);
    const o = result.rows[0];
    let reason: string | null = null;
    if (!o || o.user_id !== req.query.userId) reason = 'Order not found';
    else if (!o.has_item) reason = 'This item is not part of the order';
    else if (o.status !== 'delivered') reason = 'You can review items once your order is delivered';
    return res.json({ success: true, data: { eligible: reason === null, reason } });
  } catch (err) {
    return sendError(res, err, 'Failed to check review eligibility');
  }
});

export { router as internalRoutes };
