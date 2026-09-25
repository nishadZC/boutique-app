import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { productRoutes } from './routes/products';
import { adminRoutes } from './routes/admin';
import { internalRoutes } from './routes/internal';
import { reviewRoutes } from './routes/reviews';
import { getJwtSecret } from './middleware/auth';
import { recommendationRoutes } from './routes/recommendations';
import { connectDB } from './database/connection';
import { metricsMiddleware, setupMetrics } from './metrics';

dotenv.config({ path: './.env' });
getJwtSecret(); // fail fast if JWT_SECRET is missing in production

const app = express();
const PORT = process.env.PORT || 3003;

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
app.use(cors());
app.use(express.json());

setupMetrics(app, { serviceName: 'product-service', serviceVersion: '1.0.0' });

app.use(metricsMiddleware);

// Specific prefixes first: productRoutes' '/:id' would otherwise match them.
app.use('/admin', adminRoutes);
app.use('/internal', internalRoutes);
app.use('/reviews', reviewRoutes);
app.use('/recommendations', recommendationRoutes);
app.use('', productRoutes);

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
