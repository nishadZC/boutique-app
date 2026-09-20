import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRoutes } from './routes/auth';
import { metricsMiddleware, setupMetrics } from './metrics';

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    })
  );
  app.use(cors());
  app.use(express.json());

  setupMetrics(app, { serviceName: 'auth', serviceVersion: '1.0.0' });

  app.use(metricsMiddleware);

  app.use('', authRoutes);

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
