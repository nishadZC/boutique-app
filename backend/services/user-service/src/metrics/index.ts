import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();
collectDefaultMetrics({ register });
export const httpRequestDuration = new Histogram({ name: 'http_request_duration_seconds', help: 'Duration of HTTP requests in seconds', labelNames: ['method', 'route', 'status_code', 'service_name'], registers: [register] });
export const httpRequestTotal = new Counter({ name: 'http_requests_total', help: 'Total number of HTTP requests', labelNames: ['method', 'route', 'status_code', 'service_name'], registers: [register] });
export const httpRequestsInProgress = new Gauge({ name: 'http_requests_in_progress', help: 'Number of HTTP requests in progress', labelNames: ['method', 'service_name'], registers: [register] });
export const serviceInfo = new Gauge({ name: 'service_info', help: 'Static information about service', labelNames: ['service_name', 'version'], registers: [register] });

interface PoolStats { totalCount: number; idleCount: number; waitingCount: number; }
let databasePool: PoolStats | undefined;
export const databasePoolConnections = new Gauge({ name: 'db_pool_connections', help: 'Total PostgreSQL connections in the pool', registers: [register], collect() { this.set(databasePool?.totalCount || 0); } });
export const databasePoolIdleConnections = new Gauge({ name: 'db_pool_idle_connections', help: 'Idle PostgreSQL connections in the pool', registers: [register], collect() { this.set(databasePool?.idleCount || 0); } });
export const databasePoolWaitingClients = new Gauge({ name: 'db_pool_waiting_clients', help: 'Clients waiting for a PostgreSQL connection', registers: [register], collect() { this.set(databasePool?.waitingCount || 0); } });
export const setDatabasePool = (pool: PoolStats): void => { databasePool = pool; };

// Health checks and the scrape itself would only add noise to the RED metrics.
const UNINSTRUMENTED_PATHS = new Set(['/metrics', '/health']);

// The matched route template (e.g. "/admin/orders/:id") keeps label cardinality bounded;
// requests that matched no route are grouped together rather than labelled by path.
const routeLabel = (req: any): string => (req.route ? `${req.baseUrl}${String(req.route.path)}` : 'unmatched');

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

export const setupMetrics = (app: any, serviceName: string): void => {
  app.set('serviceName', serviceName);
  serviceInfo.set({ service_name: serviceName, version: '1.0.0' }, 1);
  app.get('/metrics', async (_req: any, res: any) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
};