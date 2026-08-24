import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();
collectDefaultMetrics({ register });
export const httpRequestDuration = new Histogram({ name: 'http_request_duration_seconds', help: 'Duration of HTTP requests in seconds', labelNames: ['method', 'route', 'status_code', 'service_name'], registers: [register] });
export const httpRequestTotal = new Counter({ name: 'http_requests_total', help: 'Total number of HTTP requests', labelNames: ['method', 'route', 'status_code', 'service_name'], registers: [register] });
export const httpRequestsInProgress = new Gauge({ name: 'http_requests_in_progress', help: 'Number of HTTP requests in progress', labelNames: ['method', 'route', 'service_name'], registers: [register] });
export const serviceInfo = new Gauge({ name: 'service_info', help: 'Static information about service', labelNames: ['service_name', 'version'], registers: [register] });

export const metricsMiddleware = (req: any, res: any, next: any): void => {
  const start = Date.now();
  const route = req.route?.path || req.path || 'unknown';
  const serviceName = req.app.get('serviceName') || 'unknown';
  httpRequestsInProgress.inc({ method: req.method, route, service_name: serviceName });
  res.on('finish', () => {
    const labels = { method: req.method, route, status_code: res.statusCode.toString(), service_name: serviceName };
    httpRequestDuration.observe(labels, (Date.now() - start) / 1000);
    httpRequestTotal.inc(labels);
    httpRequestsInProgress.dec({ method: req.method, route, service_name: serviceName });
  });
  next();
};

export const setupMetrics = (app: any, serviceName: string): void => {
  app.set('serviceName', serviceName);
  serviceInfo.set({ service_name: serviceName, version: '1.0.0' }, 1);
  app.get('/metrics', async (_req: any, res: any) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
};