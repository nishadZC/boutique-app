import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCompactCurrency, formatDay, formatDateTime, shortId, customerName, formatAddress } from './format';

describe('admin format', () => {
  it('currency', () => {
    expect(formatCurrency(1234)).toMatch(/1,234/);
    expect(formatCurrency(NaN)).toMatch(/0/);
    expect(formatCompactCurrency(150000)).toMatch(/1\.5/);
    expect(formatCompactCurrency(0)).toMatch(/0/);
  });
  it('dates', () => {
    const iso = '2026-01-08T10:00:00';
    expect(formatDay(iso)).toBe(new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    expect(formatDay(iso, true)).toBe(new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
    expect(formatDateTime(iso)).toContain('2026');
  });
  it('shortId / customerName / formatAddress', () => {
    expect(shortId('abcdef123')).toBe('#ABCDEF12');
    expect(customerName({ firstName: 'A', lastName: 'B' })).toBe('A B');
    expect(customerName({ email: 'e' })).toBe('e');
    expect(customerName({})).toBe('Customer');
    expect(customerName(null)).toBe('Customer');
    expect(formatAddress('s')).toBe('s');
    expect(formatAddress({ address: 'x' })).toBe('x');
    expect(formatAddress(null)).toBe('');
  });
});
