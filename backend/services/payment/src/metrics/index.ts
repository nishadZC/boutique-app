// Common HTTP metrics, /metrics and the request middleware live in @boutique/shared.
import { Counter } from 'prom-client';
import { register } from '@boutique/shared';

export { register, metricsMiddleware, setupMetrics } from '@boutique/shared';

export const paymentOrdersCreated = new Counter({
  name: 'payment_orders_created_total',
  help: 'Number of payment orders created',
  registers: [register],
});

export const paymentsVerified = new Counter({
  name: 'payments_verified_total',
  help: 'Number of payments successfully verified',
  registers: [register],
});

export const paymentsRefunded = new Counter({
  name: 'payments_refunded_total',
  help: 'Number of orders refunded through Razorpay',
  registers: [register],
});

export const paymentStatusUpdates = new Counter({
  name: 'payment_status_updates_total',
  help: 'Number of payment status updates sent to the orders service',
  labelNames: ['status'],
  registers: [register],
});
