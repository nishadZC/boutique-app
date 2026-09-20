import { describe, it, expect } from 'vitest';
import { getItemPrice, calculateCartTotals } from './cartPricing';

describe('getItemPrice', () => {
  it('returns numeric prices unchanged', () => {
    expect(getItemPrice({ price: 49.99, quantity: 1 })).toBe(49.99);
  });

  it('parses string prices into numbers', () => {
    expect(getItemPrice({ price: '49.99', quantity: 1 })).toBe(49.99);
  });
});

describe('calculateCartTotals', () => {
  it('returns zeroed totals for an empty cart', () => {
    expect(calculateCartTotals([])).toEqual({
      subtotal: 0,
      shipping: 15,
      tax: 0,
      total: 15,
    });
  });

  it('charges shipping and 8% tax below the $500 free-shipping threshold', () => {
    const totals = calculateCartTotals([{ price: 100, quantity: 2 }]);

    expect(totals.subtotal).toBe(200);
    expect(totals.shipping).toBe(15);
    expect(totals.tax).toBeCloseTo(16, 5);
    expect(totals.total).toBeCloseTo(231, 5);
  });

  it('waives shipping once the subtotal exceeds $500', () => {
    const totals = calculateCartTotals([{ price: 250, quantity: 3 }]);

    expect(totals.subtotal).toBe(750);
    expect(totals.shipping).toBe(0);
    expect(totals.tax).toBeCloseTo(60, 5);
    expect(totals.total).toBeCloseTo(810, 5);
  });

  it('does not waive shipping when the subtotal is exactly $500', () => {
    const totals = calculateCartTotals([{ price: 500, quantity: 1 }]);
    expect(totals.shipping).toBe(15);
  });

  it('handles string-typed prices mixed with numeric ones', () => {
    const totals = calculateCartTotals([
      { price: '19.99', quantity: 2 },
      { price: 10, quantity: 1 },
    ]);

    expect(totals.subtotal).toBeCloseTo(49.98, 5);
  });
});
