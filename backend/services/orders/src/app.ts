import express from 'express';
import helmet from 'helmet';
import { orderRoutes } from './routes/orders';
import { adminRoutes } from './routes/admin';
import { internalRoutes } from './routes/internal';
import { metricsMiddleware, setupMetrics } from './metrics';

export function createApp() {
  const app = express();
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    })
  );
  app.use(express.json());

  setupMetrics(app, { serviceName: 'orders', serviceVersion: '1.0.0' });

  app.use(metricsMiddleware);

  // Specific prefixes before the customer router, whose '/:id' routes would match them.
  app.use('/admin', adminRoutes);
  app.use('/internal', internalRoutes);
  app.use('', orderRoutes);

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
