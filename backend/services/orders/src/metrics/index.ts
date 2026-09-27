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


interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  query: (text: string) => Promise<{ rows: any[] }>;
}

let databasePool: PoolStats | undefined;

export const databasePoolConnections = new Gauge({
  name: 'db_pool_connections',
  help: 'Total PostgreSQL connections in the pool',
  registers: [register],
  collect() {
    this.set(databasePool?.totalCount || 0);
  },
});

export const databasePoolIdleConnections = new Gauge({
  name: 'db_pool_idle_connections',
  help: 'Idle PostgreSQL connections in the pool',
  registers: [register],
  collect() {
    this.set(databasePool?.idleCount || 0);
  },
});

export const databasePoolWaitingClients = new Gauge({
  name: 'db_pool_waiting_clients',
  help: 'Clients waiting for a PostgreSQL connection',
  registers: [register],
  collect() {
    this.set(databasePool?.waitingCount || 0);
  },
});

// Read from the database at scrape time, so every replica reports the same true value
// (use max(), not sum(), across replicas) and nothing drifts between restarts.
export const boutiqueTotalOrders = new Gauge({
  name: 'boutique_total_orders',
  help: 'Total number of orders placed in the Boutique application',
  registers: [register],
  async collect() {
    if (!databasePool) return;
    try {
      const { rows } = await databasePool.query('SELECT count(*)::int AS n FROM orders');
      this.set(rows[0].n);
    } catch { /* keep the last value if the database is briefly unavailable */ }
  },
});

export const boutiqueTotalRevenue = new Gauge({
  name: 'boutique_total_revenue',
  help: 'Total revenue (INR) from paid orders in the Boutique application',
  registers: [register],
  async collect() {
    if (!databasePool) return;
    try {
      const { rows } = await databasePool.query("SELECT coalesce(sum(total_amount), 0)::float AS n FROM orders WHERE payment_status = 'paid'");
      this.set(rows[0].n);
    } catch { /* keep the last value if the database is briefly unavailable */ }
  },
});

export const setDatabasePool = (pool: PoolStats): void => {
  databasePool = pool;
};

export interface MetricsOptions {
  serviceName: string;
  serviceVersion?: string;
}

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
