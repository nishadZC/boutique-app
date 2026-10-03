import { Request, Router } from 'express';
import { readAuth } from '@boutique/shared';
import { pool } from '../database/connection';

export const wishlistRoutes = Router();

// The auth service now issues signed JWT access tokens (not raw user ids).
const getUserId = (req: Request) => readAuth(req)?.userId ?? null;
const isProductId = (value: string) => /^[0-9a-f-]{36}$/i.test(value);

wishlistRoutes.get('/wishlist', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  try {
    const result = await pool.query(
      'SELECT product_id, created_at FROM wishlist_items WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({ error: 'Failed to get wishlist' });
  }
});

wishlistRoutes.post('/wishlist/:productId', async (req, res) => {
  const userId = getUserId(req);
  const { productId } = req.params;
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  if (!isProductId(productId)) return res.status(400).json({ error: 'Invalid product id' });
  try {
    const result = await pool.query(
      'INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2) ON CONFLICT (user_id, product_id) DO NOTHING RETURNING product_id',
      [userId, productId]
    );
    return res.status(result.rowCount ? 201 : 200).json({ success: true, productId });
  } catch (error) {
    console.error('Add wishlist item error:', error);
    return res.status(500).json({ error: 'Failed to add item to wishlist' });
  }
});

wishlistRoutes.delete('/wishlist/:productId', async (req, res) => {
  const userId = getUserId(req);
  const { productId } = req.params;
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  if (!isProductId(productId)) return res.status(400).json({ error: 'Invalid product id' });
  try {
    await pool.query('DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    return res.json({ success: true, productId });
  } catch (error) {
    console.error('Remove wishlist item error:', error);
    return res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
});
