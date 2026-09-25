// Field validation shared by every form. The auth and user services apply the
// same rules server-side (backend/services/*/src/validation.ts); keep them in step.

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

// WHATWG "valid e-mail address" grammar (what <input type="email"> enforces),
// with the domain required to have at least one dot.
const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
// RFC 5321 limits.
export const EMAIL_MAX_LENGTH = 254;
const EMAIL_LOCAL_MAX_LENGTH = 64;

/** Emails are case-insensitive in practice; store and compare them lowercased. */
export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const isValidEmail = (value: string): boolean => {
  const email = normalizeEmail(value);
  if (email.length === 0 || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return false;

  const [local, domain] = email.split('@');
  if (local.length > EMAIL_LOCAL_MAX_LENGTH) return false;
  // RFC 5321 dot-atom: no leading, trailing or consecutive dots.
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  // Top-level domain must be alphabetic, e.g. ".com", ".in".
  return /^[a-z]{2,}$/.test(domain.slice(domain.lastIndexOf('.') + 1));
};

export const getEmailError = (value: string): string | null => {
  if (!value.trim()) return 'Email is required';
  if (!isValidEmail(value)) return 'Enter a valid email address, e.g. name@example.com';
  return null;
};

// ---------------------------------------------------------------------------
// Phone (Indian mobile numbers)
// ---------------------------------------------------------------------------

const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;
// Characters people type when writing a number: digits, spaces, dashes, dots, brackets and a leading +.
const PHONE_INPUT_PATTERN = /^\+?[\d\s\-().]+$/;
export const PHONE_MAX_INPUT_LENGTH = 20;

/**
 * Returns the number in E.164 form (+91XXXXXXXXXX), or null if it is not a valid
 * Indian mobile number. Accepts +91 / 91 / 0 prefixes and common separators.
 */
export const normalizePhone = (value: string): string | null => {
  const input = value.trim();
  if (!input || input.length > PHONE_MAX_INPUT_LENGTH || !PHONE_INPUT_PATTERN.test(input)) return null;

  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);

  return INDIAN_MOBILE_PATTERN.test(digits) ? `+91${digits}` : null;
};

export const isValidPhone = (value: string): boolean => normalizePhone(value) !== null;

export const getPhoneError = (value: string, { required = true }: { required?: boolean } = {}): string | null => {
  if (!value.trim()) return required ? 'Phone number is required' : null;
  if (!isValidPhone(value)) return 'Enter a valid 10-digit Indian mobile number, e.g. 98765 43210';
  return null;
};

/** Display form: "+91 98765 43210". Falls back to the raw value for legacy entries. */
export const formatPhone = (value: string): string => {
  const e164 = normalizePhone(value);
  return e164 ? `+91 ${e164.slice(3, 8)} ${e164.slice(8)}` : value;
};
