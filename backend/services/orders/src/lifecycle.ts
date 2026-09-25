// Order fulfilment and payment rules. Pure functions so they can be tested
// without a database.

/** Fulfilment steps in the only order an admin may move through them. */
export const FULFILMENT_FLOW = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'] as const;
export const ORDER_STATUSES = ['pending', ...FULFILMENT_FLOW, 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

/** Statuses from which an order can still be cancelled (nothing has shipped). */
const CANCELLABLE: string[] = ['pending', 'confirmed', 'packed', 'processing'];

/** Older rows used "processing" for a paid order being prepared. */
const normalise = (status: string) => (status === 'processing' ? 'confirmed' : status);

/**
 * Whether an admin may move an order from `from` to `to`.
 * Forward one step at a time along FULFILMENT_FLOW, and only once paid;
 * cancellation is allowed until the order ships.
 */
export function canTransition(from: string, to: string, paymentStatus: string): { ok: true } | { ok: false; reason: string } {
  const current = normalise(from);
  if (current === to) return { ok: false, reason: `Order is already ${label(to)}` };
  if (current === 'cancelled' || current === 'delivered') return { ok: false, reason: `A ${label(current)} order cannot be changed` };

  if (to === 'cancelled') {
    return CANCELLABLE.includes(from) || CANCELLABLE.includes(current)
      ? { ok: true }
      : { ok: false, reason: 'Orders cannot be cancelled once they have shipped' };
  }

  const target = FULFILMENT_FLOW.indexOf(to as typeof FULFILMENT_FLOW[number]);
  if (target === -1) return { ok: false, reason: `Unknown status "${to}"` };
  if (to === 'confirmed') return { ok: false, reason: 'Orders are confirmed automatically when payment succeeds' };
  if (paymentStatus !== 'paid') return { ok: false, reason: 'Only paid orders can be fulfilled' };

  const position = FULFILMENT_FLOW.indexOf(current as typeof FULFILMENT_FLOW[number]);
  if (position === -1 || target !== position + 1) {
    const expected = position === -1 ? 'confirmed' : FULFILMENT_FLOW[position + 1];
    return { ok: false, reason: `Next step for this order is "${label(expected)}"` };
  }
  return { ok: true };
}

/** The next fulfilment step an admin can take, if any. */
export function nextStatus(status: string, paymentStatus: string): OrderStatus | null {
  if (paymentStatus !== 'paid') return null;
  const position = FULFILMENT_FLOW.indexOf(normalise(status) as typeof FULFILMENT_FLOW[number]);
  return position >= 0 && position < FULFILMENT_FLOW.length - 1 ? FULFILMENT_FLOW[position + 1] : null;
}

/** Allowed payment status changes; `failed -> paid` covers a successful retry. */
export function canChangePayment(from: string, to: string): boolean {
  const allowed: Record<string, string[]> = {
    pending: ['paid', 'failed'],
    failed: ['paid', 'failed'],
    paid: ['refunded'],
    refunded: [],
  };
  return (allowed[from] ?? []).includes(to);
}

export function label(status: string): string {
  return status.replace(/_/g, ' ');
}
