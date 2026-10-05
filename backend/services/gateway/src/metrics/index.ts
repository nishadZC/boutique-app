// Common HTTP metrics, /metrics and the request middleware live in @boutique/shared.
import { MetricsOptions, setupMetrics as setupSharedMetrics } from '@boutique/shared';

export { register, metricsMiddleware } from '@boutique/shared';

// The gateway only proxies, so Express never sets req.route; label by the proxied
// service prefix instead of the raw URL to keep cardinality bounded.
const PROXY_PREFIXES = ['/api/auth', '/api/users', '/api/products', '/api/orders', '/api/payments', '/api/wishlist', '/api/recommendations'];
export const gatewayRouteLabel = (req: any): string => {
  if (req.route) return `${req.baseUrl}${String(req.route.path)}`;
  const path: string = req.originalUrl.split('?')[0];
  return PROXY_PREFIXES.find(prefix => path === prefix || path.startsWith(`${prefix}/`)) ?? 'unmatched';
};

export const setupMetrics = (app: any, options: MetricsOptions): void =>
  setupSharedMetrics(app, { routeLabel: gatewayRouteLabel, ...options });
