import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { metricsMiddleware, setupMetrics } from './metrics';
import { adminRoutes } from './routes/admin';
import { internalRoutes } from './routes/internal';
import { locationRoutes } from './routes/location';
import { profileRoutes } from './routes/profile';

export function createApp() {
  const app = express();
  app.use(helmet({ crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' } }));
  app.use(cors());
  app.use(express.json());
  setupMetrics(app, 'user-service');
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => res.status(200).send('OK'));
  app.use('/admin', adminRoutes);
  app.use('/internal', internalRoutes);
  app.use('/', locationRoutes);
  app.use('/', profileRoutes);

  return app;
}
