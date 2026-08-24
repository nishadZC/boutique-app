import { Express } from 'express';
import client from 'prom-client';

const requests = new client.Counter({
  name: 'wishlist_http_requests_total',
  help: 'Total wishlist service HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

export const setupMetrics = (app: Express, serviceName: string) => {
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });
  app.locals.serviceName = serviceName;
};

export const metricsMiddleware = (req: any, res: any, next: any) => {
  res.on('finish', () => requests.inc({ method: req.method, route: req.route?.path || req.path, status: res.statusCode }));
  next();
};
