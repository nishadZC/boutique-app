import { Express } from 'express';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

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
  labelNames: ['method', 'route', 'service_name'],
  registers: [register],
});

export const serviceInfo = new Gauge({
  name: 'service_info',
  help: 'Static information about service',
  labelNames: ['service_name', 'version'],
  registers: [register],
});

interface PoolStats { totalCount: number; idleCount: number; waitingCount: number; }
let databasePool: PoolStats | undefined;

export const databasePoolConnections = new Gauge({
  name: 'db_pool_connections',
  help: 'Total PostgreSQL connections in the pool',
  registers: [register],
  collect() { this.set(databasePool?.totalCount || 0); },
});

export const databasePoolIdleConnections = new Gauge({
  name: 'db_pool_idle_connections',
  help: 'Idle PostgreSQL connections in the pool',
  registers: [register],
  collect() { this.set(databasePool?.idleCount || 0); },
});

export const databasePoolWaitingClients = new Gauge({
  name: 'db_pool_waiting_clients',
  help: 'Clients waiting for a PostgreSQL connection',
  registers: [register],
  collect() { this.set(databasePool?.waitingCount || 0); },
});

export const setDatabasePool = (pool: PoolStats): void => { databasePool = pool; };

export const setupMetrics = (app: Express, serviceName: string) => {
  app.set('serviceName', serviceName);
  serviceInfo.set({ service_name: serviceName, version: '1.0.0' }, 1);
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
};

export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  const route = req.route?.path || req.path || 'unknown';
  const serviceName = req.app.get('serviceName') || 'wishlist-service';
  httpRequestsInProgress.inc({ method: req.method, route, service_name: serviceName });
  res.on('finish', () => {
    const labels = { method: req.method, route, status_code: res.statusCode.toString(), service_name: serviceName };
    httpRequestDuration.observe(labels, (Date.now() - start) / 1000);
    httpRequestTotal.inc(labels);
    httpRequestsInProgress.dec({ method: req.method, route, service_name: serviceName });
  });
  next();
};
