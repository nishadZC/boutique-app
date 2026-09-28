// Verified-purchase product reviews (mounted at /reviews; gateway: /api/products/reviews).
// Only a customer whose order containing the product has been delivered may
// review it, once per order.
import axios from 'axios';
import express from 'express';
import Joi from 'joi';
import { query } from '../database/connection';
import { requireUser } from '../middleware/auth';

const router = express.Router();
const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_URL || 'http://localhost:3005';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3004';
const internalHeaders = () => ({ 'x-internal-token': process.env.INTERNAL_API_TOKEN ?? '' });

export const reviewSchema = Joi.object({
  productId: Joi.string().guid().required(),
  orderId: Joi.string().guid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().trim().max(120).allow(''),
  comment: Joi.string().trim().max(2000).allow(''),
});

const toReview = (r: any) => ({
  id: r.id,
  productId: r.product_id,
  rating: r.rating,
  title: r.title ?? '',
  comment: r.comment ?? '',
  reviewerName: r.reviewer_name || 'Verified buyer',
  createdAt: r.created_at,
});

router.get('/product/:productId', async (req, res) => {
  const { error } = Joi.string().guid().validate(req.params.productId);
  if (error) return res.status(404).json({ success: false, error: 'Product not found' });
  const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '10'), 10) || 10, 1), 50);
  try {
    const [rows, summary] = await Promise.all([
      query(`SELECT id, product_id, rating, title, comment, reviewer_name, created_at
             FROM product_reviews WHERE product_id = $1 ORDER BY created_at DESC LIMIT $2`, [req.params.productId, limit]),
      query(`SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS average,
                    COUNT(*) FILTER (WHERE rating = 5) AS r5, COUNT(*) FILTER (WHERE rating = 4) AS r4,
                    COUNT(*) FILTER (WHERE rating = 3) AS r3, COUNT(*) FILTER (WHERE rating = 2) AS r2,
                    COUNT(*) FILTER (WHERE rating = 1) AS r1
             FROM product_reviews WHERE product_id = $1`, [req.params.productId]),
    ]);
    const s = summary.rows[0];
    return res.json({
      success: true,
      data: {
        reviews: rows.rows.map(toReview),
        summary: {
          count: Number(s.count),
          average: Math.round(Number(s.average) * 10) / 10,
          distribution: { 5: Number(s.r5), 4: Number(s.r4), 3: Number(s.r3), 2: Number(s.r2), 1: Number(s.r1) },
        },
      },
    });
  } catch (err) {
    console.error('List reviews error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load reviews' });
  }
});

/** Which products of an order the signed-in customer has already reviewed. */
router.get('/mine', requireUser, async (req, res) => {
  const { error } = Joi.string().guid().validate(req.query.orderId);
  if (error) return res.status(400).json({ success: false, error: 'orderId is required' });
  try {
    const result = await query(
      'SELECT product_id, rating FROM product_reviews WHERE user_id = $1 AND order_id = $2',
      [req.auth!.userId, req.query.orderId]);
    return res.json({ success: true, data: result.rows.map((r: any) => ({ productId: r.product_id, rating: r.rating })) });
  } catch (err) {
    console.error('My reviews error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load your reviews' });
  }
});

router.post('/', requireUser, async (req, res) => {
  const { value, error } = reviewSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, error: error.details.map(d => d.message.replace(/"/g, '')).join('; ') });

  try {
    const eligibility = await axios.get(`${ORDERS_SERVICE_URL}/internal/orders/${value.orderId}/review-eligibility`, {
      params: { userId: req.auth!.userId, productId: value.productId },
      headers: internalHeaders(),
      timeout: 5000,
    });
    if (!eligibility.data?.data?.eligible) {
      return res.status(403).json({ success: false, error: eligibility.data?.data?.reason ?? 'You can review items once they are delivered' });
    }

    let reviewerName = 'Verified buyer';
    try {
      const profile = await axios.get(`${USER_SERVICE_URL}/internal/users/${req.auth!.userId}/display-name`, { headers: internalHeaders(), timeout: 3000 });
      reviewerName = profile.data?.data?.displayName || reviewerName;
    } catch {
      // The review is still valid without a display name.
    }

    const inserted = await query(
      `INSERT INTO product_reviews (product_id, user_id, order_id, rating, title, comment, reviewer_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (order_id, product_id, user_id) DO NOTHING
       RETURNING id, product_id, rating, title, comment, reviewer_name, created_at`,
      [value.productId, req.auth!.userId, value.orderId, value.rating, value.title ?? '', value.comment ?? '', reviewerName]);
    if (inserted.rows.length === 0) {
      return res.status(409).json({ success: false, error: 'You have already reviewed this item for this order' });
    }
    return res.status(201).json({ success: true, data: toReview(inserted.rows[0]) });
  } catch (err: any) {
    if (err?.response?.status === 404) return res.status(404).json({ success: false, error: 'Order not found' });
    console.error('Create review error:', err?.message ?? err);
    return res.status(502).json({ success: false, error: 'Could not submit your review, please try again' });
  }
});

export { router as reviewRoutes };
