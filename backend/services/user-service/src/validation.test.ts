import { describe, it, expect } from 'vitest';
import { normalizePhone } from './validation';

describe('normalizePhone', () => {
  it.each([
    ['9876543210', '+919876543210'],
    ['+91 98765 43210', '+919876543210'],
    ['919876543210', '+919876543210'],
    ['09876543210', '+919876543210'],
    ['(987) 654-3210', '+919876543210'],
  ])('normalizes %s', (input, out) => expect(normalizePhone(input)).toBe(out));
  it.each([[123], [''], ['   '], ['abc'], ['1'.repeat(21)], ['5876543210'], ['12345']])('rejects %s', input =>
    expect(normalizePhone(input)).toBeNull());
});
