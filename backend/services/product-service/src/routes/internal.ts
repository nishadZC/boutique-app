// Service-to-service endpoints (mounted at /internal). Callers must send the
// shared INTERNAL_API_TOKEN; the gateway strips that header from public traffic.
import express from 'express';
import Joi from 'joi';
import { getPool } from '../database/connection';
import { requireInternal } from '@boutique/shared';

const router = express.Router();
router.use(requireInternal);

const commitSchema = Joi.object({
  orderId: Joi.string().guid().required(),
  direction: Joi.string().valid('sale', 'restock').required(),
  items: Joi.array().items(Joi.object({
    productId: Joi.string().guid().required(),
    quantity: Joi.number().integer().min(1).max(1000).required(),
  })).min(1).max(100).required(),
});

/**
 * Deducts (sale) or returns (restock) an order's items in one transaction.
 * A sale never takes stock below zero; any shortfall is reported back so the
 * order can be flagged for follow-up instead of failing a completed payment.
 */
router.post('/inventory/commit', async (req, res) => {
  const { value, error } = commitSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, error: error.message });

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const shortages: { productId: string; requested: number; available: number }[] = [];
    // Lock rows in a stable order so concurrent orders cannot deadlock.
    const items = [...value.items].sort((a, b) => a.productId.localeCompare(b.productId));
    for (const item of items) {
      const locked = await client.query('SELECT inventory_quantity FROM products WHERE id = $1 FOR UPDATE', [item.productId]);
      if (locked.rows.length === 0) continue;
      const before = Number(locked.rows[0].inventory_quantity ?? 0);
      let delta = value.direction === 'sale' ? -item.quantity : item.quantity;
      if (value.direction === 'sale' && before < item.quantity) {
        shortages.push({ productId: item.productId, requested: item.quantity, available: before });
        delta = -before;
      }
      if (delta === 0) continue;
      const after = before + delta;
      await client.query('UPDATE products SET inventory_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [after, item.productId]);
      await client.query(
        `INSERT INTO inventory_adjustments (product_id, delta, resulting_quantity, reason, note, actor, order_id)
         VALUES ($1, $2, $3, $4, $5, 'system', $6)`,
        [item.productId, delta, after, value.direction === 'sale' ? 'sale' : 'order_restock',
          value.direction === 'sale' ? 'Order paid' : 'Order cancelled or refunded', value.orderId]);
    }
    await client.query('COMMIT');
    return res.json({ success: true, data: { shortages } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Inventory commit error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update stock' });
  } finally {
    client.release();
  }
});

export { router as internalRoutes };
