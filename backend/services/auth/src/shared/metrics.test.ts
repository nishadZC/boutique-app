import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { EventEmitter } from 'events';
import { register, setupMetrics, metricsMiddleware, setDatabasePool, databaseGauge, routeTemplateLabel } from '@boutique/shared';

describe('shared metrics', () => {
  it('setupMetrics with a string name adds /metrics but not /health, and a custom route label', async () => {
    const app = express();
    setupMetrics(app, 'svc-str', '2.0.0');
    app.use(metricsMiddleware);
    app.get('/x', (_req, res) => { res.send('ok'); });
    expect((await request(app).get('/health')).status).toBe(404);
    await request(app).get('/x');
    const m = await request(app).get('/metrics');
    expect(m.text).toMatch(/service_info\{service_name="svc-str",version="2.0.0"\} 1/);
    expect(m.text).toMatch(/route="\/x",status_code="200",service_name="svc-str"/);
  });

  it('uses a custom routeLabel and labels unmatched routes', async () => {
    const app = express();
    setupMetrics(app, { serviceName: 'svc-obj', routeLabel: () => 'custom' });
    app.use(metricsMiddleware);
    expect((await request(app).get('/health')).body.status).toBe('svc-obj is healthy');
    await request(app).get('/nope');
    const m = await register.metrics();
    expect(m).toMatch(/route="custom",status_code="404",service_name="svc-obj"/);
    expect(routeTemplateLabel({})).toBe('unmatched');
    expect(routeTemplateLabel({ baseUrl: '/a', route: { path: '/:id' } })).toBe('/a/:id');
  });

  it('releases in-progress on close without finish and ignores duplicate events', () => {
    const res: any = new EventEmitter(); res.statusCode = 200;
    const req: any = { path: '/y', method: 'GET', app: { get: () => undefined } };
    const next = vi.fn();
    metricsMiddleware(req, res, next);
    res.emit('close');
    res.emit('finish');
    expect(next).toHaveBeenCalled();
  });

  it('pool gauges and database gauges read the pool at scrape time', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ n: 7 }] })
      .mockRejectedValueOnce(new Error('down'));
    setDatabasePool({ totalCount: 3, idleCount: 2, waitingCount: 1, query });
    setDatabasePool({ totalCount: 4, idleCount: 2, waitingCount: 1, query });
    databaseGauge('test_db_gauge', 'help', 'SELECT 7 AS n');
    let m = await register.metrics();
    expect(m).toMatch(/db_pool_connections 4/);
    expect(m).toMatch(/test_db_gauge 7/);
    m = await register.metrics();
    expect(m).toMatch(/test_db_gauge 7/);
    setDatabasePool({ totalCount: 0, idleCount: 0, waitingCount: 0 });
    await register.metrics();
  });
});
