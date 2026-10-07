import { describe, it, expect } from 'vitest';
import { formatPhone, getPhoneError } from './validation';

describe('validation extra', () => {
  it('formatPhone', () => {
    expect(formatPhone('9876543210')).toBe('+91 98765 43210');
    expect(formatPhone('legacy')).toBe('legacy');
  });
  it('getPhoneError optional', () => {
    expect(getPhoneError(' ', { required: false })).toBeNull();
    expect(getPhoneError('')).toBe('Phone number is required');
    expect(getPhoneError('123')).toMatch(/valid/);
    expect(getPhoneError('09876543210')).toBeNull();
  });
});
