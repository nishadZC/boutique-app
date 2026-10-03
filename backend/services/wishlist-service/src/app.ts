import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { metricsMiddleware, setupMetrics } from './metrics';
import { wishlistRoutes } from './routes/wishlist';

export function createApp() {
  const app = express();
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    })
  );
  app.use(cors());
  app.use(express.json());
  setupMetrics(app, 'wishlist-service');
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => res.status(200).send('OK'));
  app.use('/', wishlistRoutes);

  return app;
}
