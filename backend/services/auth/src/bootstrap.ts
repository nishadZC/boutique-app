// Creates the store's admin account on first start. The initial password comes
// from a secret (ADMIN_INITIAL_PASSWORD), never from code or SQL, and the account
// is flagged so the first sign-in must replace it. An existing account is never
// modified, so redeploys cannot reset the admin's password.
import bcrypt from 'bcryptjs';
import { isValidEmail, normalizeEmail } from './validation';

export const DEFAULT_ADMIN_EMAIL = 'admin@luxatelier.in';
export const ADMIN_PASSWORD_MIN_LENGTH = 12;

type Query = (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount?: number | null }>;

export async function ensureBootstrapAdmin(query: Query, env = process.env): Promise<'created' | 'exists' | 'skipped'> {
  const email = normalizeEmail(env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL);
  const password = env.ADMIN_INITIAL_PASSWORD ?? '';

  if (!isValidEmail(email)) {
    console.error(`Bootstrap admin skipped: ADMIN_EMAIL "${email}" is not a valid email`);
    return 'skipped';
  }
  const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
  if (existing.rows.length > 0) return 'exists';

  if (password.length < ADMIN_PASSWORD_MIN_LENGTH) {
    console.warn(`Bootstrap admin ${email} not created: set ADMIN_INITIAL_PASSWORD (at least ${ADMIN_PASSWORD_MIN_LENGTH} characters)`);
    return 'skipped';
  }

  const hash = await bcrypt.hash(password, 12);
  const inserted = await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, must_change_password)
     VALUES ($1, $2, 'Store', 'Admin', 'admin', true)
     ON CONFLICT (email) DO NOTHING RETURNING id`,
    [email, hash]);
  if (inserted.rows.length) console.log(`Bootstrap admin ${email} created; the first sign-in must set a new password`);
  return inserted.rows.length ? 'created' : 'exists';
}
