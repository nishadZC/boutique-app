// Common HTTP metrics, /metrics and the request middleware live in @boutique/shared.
export { register, metricsMiddleware, setupMetrics, setDatabasePool } from '@boutique/shared';
import { databaseGauge } from '@boutique/shared';

export const boutiqueTotalUsers = databaseGauge(
  'boutique_total_users',
  'Total number of registered users in the Boutique application',
  'SELECT count(*)::int AS n FROM users',
);
