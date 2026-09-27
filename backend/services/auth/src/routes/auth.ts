import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../database/connection';
import { isValidEmail, normalizeEmail, PASSWORD_MIN_LENGTH } from '../validation';
import { getJwtSecret, readAuth, requireUser } from '../middleware/auth';
import { ADMIN_PASSWORD_MIN_LENGTH } from '../bootstrap';

const router = express.Router();
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(googleClientId);

const JWT_SECRET = getJwtSecret();
// Demo sign-in (any new email + password "demo") is for local demos only.
const DEMO_LOGIN_ENABLED = process.env.DEMO_LOGIN_ENABLED === 'true' && process.env.NODE_ENV !== 'production';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1h') as jwt.SignOptions['expiresIn'];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

function signAccessToken(user: AuthUser) {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * A short-lived token that can only be exchanged at /complete-password-change.
 * Every service rejects it as an access token (it carries a `type`).
 */
const PASSWORD_CHANGE_TTL = '10m';
function signPasswordChangeToken(user: { id: string }) {
  return jwt.sign({ userId: user.id, type: 'password_change' }, JWT_SECRET, { expiresIn: PASSWORD_CHANGE_TTL });
}

const publicUser = (user: any) => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  role: user.role,
  phone: user.phone,
  address: user.address,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

/** Sends a full session, or only a password-change token while a reset is pending. */
function sendSession(res: express.Response, user: any, message: string, status = 200) {
  if (user.must_change_password) {
    return res.status(200).json({
      passwordChangeRequired: true,
      passwordChangeToken: signPasswordChangeToken(user),
      user: { email: user.email, firstName: user.first_name },
      message: 'Choose a new password to finish signing in',
    });
  }
  return res.status(status).json({
    user: publicUser(user),
    token: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    message,
  });
}

function signRefreshToken(user: AuthUser) {
  return jwt.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

router.post('/register', async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);
    const firstName = typeof req.body.firstName === 'string' ? req.body.firstName.trim() : '';
    const lastName = typeof req.body.lastName === 'string' ? req.body.lastName.trim() : '';

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
    }
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First and last name are required' });
    }

    const existingUser = await query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role, phone, address, created_at, updated_at',
      [email, hashedPassword, firstName, lastName, 'customer']
    );

    const user = result.rows[0];

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      token: signAccessToken(user),
      refreshToken: signRefreshToken(user),
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!isValidEmail(email) || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Enter a valid email address and password' });
    }

    // Demo mode (local only): an email that has no account yet plus the password
    // "demo" creates a demo customer. It never signs in to an existing account;
    // demo users sign in again through the normal password check below.
    if (DEMO_LOGIN_ENABLED && password === 'demo') {
      const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
      if (existing.rows.length === 0) {
        const hashedPassword = await bcrypt.hash('demo', 10);
        const newUser = await query(
          'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role, phone, address, created_at, updated_at',
          [email, hashedPassword, 'Demo', 'User', 'customer']
        );
        const user = newUser.rows[0];
        return res.status(201).json({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            phone: user.phone,
            address: user.address,
            createdAt: user.created_at,
            updatedAt: user.updated_at
          },
          token: signAccessToken(user),
          refreshToken: signRefreshToken(user),
          message: 'Demo account created'
        });
      }
    }

    // Normal password check
    const result = await query('SELECT id, email, password_hash, first_name, last_name, role, phone, address, must_change_password, created_at, updated_at FROM users WHERE LOWER(email) = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return sendSession(res, user, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/google', async (req, res) => {
  try {
    if (!googleClientId) {
      return res.status(503).json({ error: 'Google sign-in is not configured' });
    }

    const { credential } = req.body;
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ error: 'Google account email is not verified' });
    }

    const firstName = payload.given_name || payload.name?.split(' ')[0] || 'Google';
    const lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || 'User';
    const googleEmail = normalizeEmail(payload.email);
    const existingUser = await query(
      'SELECT id, email, first_name, last_name, role, phone, address, must_change_password, created_at, updated_at FROM users WHERE LOWER(email) = $1',
      [googleEmail]
    );

    let user = existingUser.rows[0];
    if (!user) {
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      const newUser = await query(
        'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role, phone, address, created_at, updated_at',
        [googleEmail, passwordHash, firstName, lastName, 'customer']
      );
      user = newUser.rows[0];
    }


    return sendSession(res, user, 'Google login successful');
  } catch (error: any) {
    console.error('Google login error:', error);
    return res.status(401).json({ error: 'Google sign-in failed' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId?: string; type?: string };
    if (decoded.type !== 'refresh' || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const result = await query(
      'SELECT id, email, role, must_change_password FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (result.rows.length === 0 || result.rows[0].must_change_password) {
      return res.status(401).json({ error: 'Please sign in again' });
    }

    res.json({ token: signAccessToken(result.rows[0]) });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

/** Finishes a forced password reset and signs the user in. */
router.post('/complete-password-change', async (req, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  let userId: string | undefined;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    if (decoded.type === 'password_change' && typeof decoded.userId === 'string') userId = decoded.userId;
  } catch {
    // fall through to 401
  }
  if (!userId) return res.status(401).json({ error: 'This reset link has expired. Sign in again to continue.' });

  const { newPassword } = req.body ?? {};
  try {
    const result = await query(
      'SELECT id, email, password_hash, first_name, last_name, role, phone, address, must_change_password, created_at, updated_at FROM users WHERE id = $1',
      [userId]);
    const user = result.rows[0];
    if (!user || !user.must_change_password) return res.status(401).json({ error: 'Sign in again to continue' });

    const minLength = user.role === 'admin' ? ADMIN_PASSWORD_MIN_LENGTH : PASSWORD_MIN_LENGTH;
    if (typeof newPassword !== 'string' || newPassword.length < minLength) {
      return res.status(400).json({ error: `Your new password must be at least ${minLength} characters` });
    }
    if (await bcrypt.compare(newPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Choose a password different from the one you were given' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    const updated = await query(
      `UPDATE users SET password_hash = $1, must_change_password = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND must_change_password = true
       RETURNING id, email, first_name, last_name, role, phone, address, must_change_password, created_at, updated_at`,
      [hashed, userId]);
    if (updated.rows.length === 0) return res.status(409).json({ error: 'Your password was already changed. Sign in with it.' });
    return sendSession(res, updated.rows[0], 'Password updated');
  } catch (error) {
    console.error('Complete password change error:', error);
    return res.status(500).json({ error: 'Could not update your password' });
  }
});

router.post('/change-password', requireUser, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== 'string' || !currentPassword) {
    return res.status(400).json({ error: 'Current password is required' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({ error: `New password must be at least ${PASSWORD_MIN_LENGTH} characters` });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({ error: 'New password must be different from the current one' });
  }

  try {
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.auth!.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!(await bcrypt.compare(currentPassword, result.rows[0].password_hash))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashed, req.auth!.userId]);
    return res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

router.get('/me', async (req, res) => {
  const userId = readAuth(req)?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, role, phone, address, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phone: user.phone,
      address: user.address,
      createdAt: user.created_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export { router as authRoutes };