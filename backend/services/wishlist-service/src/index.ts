import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request } from 'express';
import helmet from 'helmet';
import { Pool } from 'pg';
import { metricsMiddleware, setDatabasePool, setupMetrics } from './metrics';

dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
setDatabasePool(pool);
const app = express();
const port = Number(process.env.PORT) || 3007;

app.use(helmet());
app.use(cors());
app.use(express.json());
setupMetrics(app, 'wishlist-service');
app.use(metricsMiddleware);

const getUserId = (req: Request) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  return token && /^[0-9a-f-]{36}$/i.test(token) ? token : null;
};
const isProductId = (value: string) => /^[0-9a-f-]{36}$/i.test(value);

app.get('/health', (_req, res) => res.status(200).send('OK'));

app.get('/wishlist', async (req, res) => {
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

app.post('/wishlist/:productId', async (req, res) => {
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

app.delete('/wishlist/:productId', async (req, res) => {
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

pool.connect().then(client => {
  client.release();
  app.listen(port, '0.0.0.0', () => console.log(`Wishlist service running on port ${port}`));
}).catch(error => {
  console.error('Failed to connect wishlist service database:', error);
  process.exit(1);
});
