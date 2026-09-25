import { describe, it, expect } from 'vitest';
import { canChangePayment, canTransition, nextStatus } from './lifecycle';

describe('fulfilment transitions', () => {
  it.each([
    ['confirmed', 'packed'],
    ['packed', 'shipped'],
    ['shipped', 'out_for_delivery'],
    ['out_for_delivery', 'delivered'],
    ['processing', 'packed'], // legacy rows
  ])('allows %s -> %s for a paid order', (from, to) => {
    expect(canTransition(from, to, 'paid')).toEqual({ ok: true });
  });

  it.each([
    ['confirmed', 'shipped'],        // skips packed
    ['packed', 'delivered'],         // skips two steps
    ['shipped', 'packed'],           // backwards
    ['delivered', 'out_for_delivery'],
  ])('rejects %s -> %s', (from, to) => {
    expect(canTransition(from, to, 'paid').ok).toBe(false);
  });

  it('never fulfils an unpaid order', () => {
    expect(canTransition('pending', 'packed', 'pending')).toMatchObject({ ok: false, reason: 'Only paid orders can be fulfilled' });
    expect(canTransition('confirmed', 'packed', 'failed').ok).toBe(false);
  });

  it('leaves confirmation to the payment flow', () => {
    expect(canTransition('pending', 'confirmed', 'paid').ok).toBe(false);
  });

  it('allows cancelling until the order ships', () => {
    for (const status of ['pending', 'confirmed', 'packed', 'processing']) {
      expect(canTransition(status, 'cancelled', 'paid')).toEqual({ ok: true });
    }
    for (const status of ['shipped', 'out_for_delivery', 'delivered']) {
      expect(canTransition(status, 'cancelled', 'paid').ok).toBe(false);
    }
  });

  it('treats delivered and cancelled as final', () => {
    expect(canTransition('cancelled', 'packed', 'paid').ok).toBe(false);
    expect(canTransition('delivered', 'cancelled', 'paid').ok).toBe(false);
  });

  it('suggests the next step', () => {
    expect(nextStatus('confirmed', 'paid')).toBe('packed');
    expect(nextStatus('out_for_delivery', 'paid')).toBe('delivered');
    expect(nextStatus('delivered', 'paid')).toBeNull();
    expect(nextStatus('pending', 'pending')).toBeNull();
  });
});

describe('payment transitions', () => {
  it.each([
    ['pending', 'paid', true],
    ['pending', 'failed', true],
    ['failed', 'paid', true],       // retry after a failed attempt
    ['paid', 'refunded', true],
    ['paid', 'failed', false],
    ['paid', 'pending', false],
    ['refunded', 'paid', false],
    ['pending', 'refunded', false],
  ])('%s -> %s is %s', (from, to, allowed) => {
    expect(canChangePayment(from, to)).toBe(allowed);
  });
});
