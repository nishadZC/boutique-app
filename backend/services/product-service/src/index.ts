import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import multer from 'multer';
import { uploadProductImage } from './services/imageService';
import { productRoutes } from './routes/products';
import { recommendationRoutes } from './routes/recommendations';
import { connectDB,query } from './database/connection';
import { metricsMiddleware, setupMetrics } from './metrics';

dotenv.config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

setupMetrics(app, { serviceName: 'product-service', serviceVersion: '1.0.0' });

app.use(metricsMiddleware);

app.use('', productRoutes);
app.use('/recommendations', recommendationRoutes);

app.post('/products/:id/images', multer({ storage: multer.memoryStorage() }).single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'An image file is required' });
    return;
  }

  try {
    const imageUrl = await uploadProductImage(req.file.buffer, req.params.id);
    const imageResult = await query(
      'UPDATE product_images SET image_url = $1 WHERE product_id = $2 AND is_primary = true',
      [imageUrl, req.params.id]
    );
    if (imageResult.rowCount === 0) {
      await query(
        'INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, true)',
        [req.params.id, imageUrl]
      );
    }
    res.status(201).json({ success: true, data: { imageUrl } });
  } catch (error) {
    console.error('Product image upload error:', error);
    res.status(502).json({ success: false, error: 'Failed to upload product image' });
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Product service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start product service:', error);
    process.exit(1);
  }
};

startServer();
