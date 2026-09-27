import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service_name'],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service_name'],
  registers: [register],
});

export const httpRequestsInProgress = new Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests in progress',
  labelNames: ['method', 'service_name'],
  registers: [register],
});

export const serviceInfo = new Gauge({
  name: 'service_info',
  help: 'Static information about service',
  labelNames: ['service_name', 'version'],
  registers: [register],
});

export interface MetricsOptions {
  serviceName: string;
  serviceVersion?: string;
}

// Health checks and the scrape itself would only add noise to the RED metrics.
const UNINSTRUMENTED_PATHS = new Set(['/metrics', '/health']);

// The gateway only proxies, so Express never sets req.route; label by the proxied
// service prefix instead of the raw URL to keep cardinality bounded.
const PROXY_PREFIXES = ['/api/auth', '/api/users', '/api/products', '/api/orders', '/api/payments', '/api/wishlist', '/api/recommendations'];
const routeLabel = (req: any): string => {
  if (req.route) return `${req.baseUrl}${String(req.route.path)}`;
  const path: string = req.originalUrl.split('?')[0];
  return PROXY_PREFIXES.find(prefix => path === prefix || path.startsWith(`${prefix}/`)) ?? 'unmatched';
};

export const metricsMiddleware = (req: any, res: any, next: any): void => {
  if (UNINSTRUMENTED_PATHS.has(req.path)) return next();

  const serviceName = req.app.get('serviceName') || 'unknown';
  const inProgressLabels = { method: req.method, service_name: serviceName };
  const endTimer = httpRequestDuration.startTimer();
  httpRequestsInProgress.inc(inProgressLabels);

  // 'close' without 'finish' means the client went away; still release the in-progress slot.
  let done = false;
  const complete = (finished: boolean) => {
    if (done) return;
    done = true;
    httpRequestsInProgress.dec(inProgressLabels);
    if (!finished) return;
    // Resolved after routing so the label is the route template, not the raw URL.
    const labels = { method: req.method, route: routeLabel(req), status_code: String(res.statusCode), service_name: serviceName };
    endTimer(labels);
    httpRequestTotal.inc(labels);
  };
  res.once('finish', () => complete(true));
  res.once('close', () => complete(false));

  next();
};

export function setupMetrics(app: any, options: MetricsOptions) {
  const { serviceName, serviceVersion = '1.0.0' } = options;

  app.set('serviceName', serviceName);

  serviceInfo.set({ service_name: serviceName, version: serviceVersion }, 1);

  app.get('/metrics', async (req: any, res: any) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.get('/health', (req: any, res: any) => {
    res.json({ status: `${serviceName} is healthy`, timestamp: new Date().toISOString() });
  });
}
