import { describe, it, expect, vi, afterEach } from 'vitest';
import { DELIVERY_DAYS, estimatedDeliveryDate, formatDeliveryDate, orderDelivery } from './delivery';

afterEach(() => vi.useRealTimers());

const base = { status: 'processing', paymentStatus: 'paid', createdAt: '2026-01-01T10:00:00', updatedAt: '2026-01-05T10:00:00' } as const;

describe('delivery', () => {
  it('estimatedDeliveryDate adds DELIVERY_DAYS', () => {
    expect(estimatedDeliveryDate('2026-01-01T10:00:00').getDate()).toBe(1 + DELIVERY_DAYS);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T10:00:00'));
    expect(estimatedDeliveryDate().getDate()).toBe(8);
  });

  it('formatDeliveryDate formats en-IN', () => {
    expect(formatDeliveryDate('2026-01-08T10:00:00')).toBe(new Date('2026-01-08T10:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }));
  });

  it('returns null for cancelled or unpaid', () => {
    expect(orderDelivery({ ...base, status: 'cancelled' } as never)).toBeNull();
    expect(orderDelivery({ ...base, paymentStatus: 'pending' } as never)).toBeNull();
  });

  it('delivered uses deliveredAt or updatedAt', () => {
    expect(orderDelivery({ ...base, status: 'delivered' } as never, '2026-02-02T10:00:00')).toEqual({ label: 'Delivered', date: formatDeliveryDate('2026-02-02T10:00:00') });
    expect(orderDelivery({ ...base, status: 'delivered', paymentStatus: 'refunded' } as never)).toEqual({ label: 'Delivered', date: formatDeliveryDate(base.updatedAt) });
  });

  it('deliver-by uses paidAt or createdAt', () => {
    expect(orderDelivery({ ...base, paidAt: '2026-01-03T10:00:00' } as never)!.date).toBe(formatDeliveryDate('2026-01-10T10:00:00'));
    expect(orderDelivery(base as never)).toEqual({ label: 'Deliver by', date: formatDeliveryDate('2026-01-08T10:00:00') });
  });
});
