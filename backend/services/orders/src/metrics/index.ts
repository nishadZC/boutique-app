// Common HTTP metrics, /metrics and the request middleware live in @boutique/shared.
export { register, metricsMiddleware, setupMetrics, setDatabasePool } from '@boutique/shared';
import { databaseGauge } from '@boutique/shared';

export const boutiqueTotalOrders = databaseGauge(
  'boutique_total_orders',
  'Total number of orders placed in the Boutique application',
  'SELECT count(*)::int AS n FROM orders',
);

export const boutiqueTotalRevenue = databaseGauge(
  'boutique_total_revenue',
  'Total revenue (INR) from paid orders in the Boutique application',
  "SELECT coalesce(sum(total_amount), 0)::float AS n FROM orders WHERE payment_status = 'paid'",
);
