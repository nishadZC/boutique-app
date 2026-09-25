// Server-side twin of frontend/src/utils/validation.ts (email rules). The client
// check is for UX only; this is the one that is enforced.

const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
const EMAIL_MAX_LENGTH = 254;
const EMAIL_LOCAL_MAX_LENGTH = 64;

export const PASSWORD_MIN_LENGTH = 8;

export const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export const isValidEmail = (value: unknown): boolean => {
  const email = normalizeEmail(value);
  if (email.length === 0 || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return false;

  const [local, domain] = email.split('@');
  if (local.length > EMAIL_LOCAL_MAX_LENGTH) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  return /^[a-z]{2,}$/.test(domain.slice(domain.lastIndexOf('.') + 1));
};
