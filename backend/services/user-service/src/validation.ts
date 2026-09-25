// Server-side twin of frontend/src/utils/validation.ts (phone rules). The client
// check is for UX only; this is the one that is enforced.

const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;
const PHONE_INPUT_PATTERN = /^\+?[\d\s\-().]+$/;
const PHONE_MAX_INPUT_LENGTH = 20;

/**
 * Returns the number in E.164 form (+91XXXXXXXXXX), or null if it is not a valid
 * Indian mobile number. Accepts +91 / 91 / 0 prefixes and common separators.
 */
export const normalizePhone = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (!input || input.length > PHONE_MAX_INPUT_LENGTH || !PHONE_INPUT_PATTERN.test(input)) return null;

  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);

  return INDIAN_MOBILE_PATTERN.test(digits) ? `+91${digits}` : null;
};
