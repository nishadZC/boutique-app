import { describe, it, expect } from 'vitest';
import {
  normalizeEmail, isValidEmail, getEmailError,
  normalizePhone, isValidPhone, getPhoneError, formatPhone,
} from './validation';

describe('email validation', () => {
  it.each([
    'jane@example.com',
    'Jane.Doe@Example.co.in',
    'j+orders@mail.example.org',
    '  jane@example.com  ',
    "o'brien@example.ie",
  ])('accepts %s', email => expect(isValidEmail(email)).toBe(true));

  it.each([
    '',
    'jane',
    'jane@',
    '@example.com',
    'jane@example',
    'jane@@example.com',
    'jane doe@example.com',
    'jane..doe@example.com',
    '.jane@example.com',
    'jane.@example.com',
    'jane@-example.com',
    'jane@example.c0m',
    'jane@example.c',
    `${'a'.repeat(65)}@example.com`,
    `jane@${'a'.repeat(250)}.com`,
  ])('rejects %j', email => expect(isValidEmail(email)).toBe(false));

  it('normalises case and surrounding whitespace', () => {
    expect(normalizeEmail('  Jane.Doe@Example.COM ')).toBe('jane.doe@example.com');
  });

  it('explains what is wrong', () => {
    expect(getEmailError('')).toBe('Email is required');
    expect(getEmailError('jane@example')).toMatch(/valid email/);
    expect(getEmailError('jane@example.com')).toBeNull();
  });
});

describe('phone validation', () => {
  it.each([
    ['9876543210', '+919876543210'],
    ['98765 43210', '+919876543210'],
    ['+91 98765 43210', '+919876543210'],
    ['+91-98765-43210', '+919876543210'],
    ['919876543210', '+919876543210'],
    ['09876543210', '+919876543210'],
    ['(987) 654-3210', '+919876543210'],
    ['6000000000', '+916000000000'],
  ])('normalises %j to %s', (input, expected) => expect(normalizePhone(input)).toBe(expected));

  it.each([
    '',
    '12345',
    '5876543210',          // Indian mobiles start with 6-9
    '98765432101',         // 11 digits without a leading 0
    '+44 7911 123456',     // non-Indian number
    '98765abc10',
    '9876543210 ext 2',
    '++919876543210',
    '9'.repeat(25),
  ])('rejects %j', input => expect(isValidPhone(input)).toBe(false));

  it('treats an empty optional phone as valid', () => {
    expect(getPhoneError('', { required: false })).toBeNull();
    expect(getPhoneError('')).toBe('Phone number is required');
    expect(getPhoneError('12345')).toMatch(/10-digit/);
  });

  it('formats for display', () => {
    expect(formatPhone('9876543210')).toBe('+91 98765 43210');
    expect(formatPhone('legacy value')).toBe('legacy value');
  });
});
