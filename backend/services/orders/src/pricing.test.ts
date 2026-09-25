import { describe, it, expect } from 'vitest';
import { priceOrder } from './pricing';

describe('priceOrder', () => {
  it('charges shipping at or below the free-shipping threshold', () => {
    expect(priceOrder([{ price: 250, quantity: 2 }])).toEqual({ subtotal: 500, shipping: 15, tax: 40, total: 555 });
  });

  it('ships free above the threshold', () => {
    expect(priceOrder([{ price: 1499.5, quantity: 2 }])).toEqual({ subtotal: 2999, shipping: 0, tax: 239.92, total: 3238.92 });
  });

  it('rounds to paise', () => {
    expect(priceOrder([{ price: 333.33, quantity: 3 }]).tax).toBe(80);
  });
});
