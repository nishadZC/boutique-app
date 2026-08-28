import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../database/connection';
import { boutiqueTotalUsers } from '../metrics';

const router = express.Router();
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(googleClientId);

// Simple demo authentication without JWT
let currentUser: any = null;

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role, phone, address, created_at, updated_at',
      [email, hashedPassword, firstName, lastName, 'customer']
    );

    const user = result.rows[0];
    boutiqueTotalUsers.inc(1); // Increment Prometheus metric
    currentUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phone: user.phone,
      address: user.address
    };

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
      token: user.id.toString(),
      refreshToken: user.id.toString(),
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // For demo mode: accept any email with password "demo"
    if (password === 'demo') {
      let user;
      const result = await query('SELECT id, email, first_name, last_name, role, phone, address, created_at, updated_at FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        // Create demo user if doesn't exist
        const hashedPassword = await bcrypt.hash('demo', 10);
        const newUser = await query(
          'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role, phone, address, created_at, updated_at',
          [email, hashedPassword, 'Demo', 'User', 'customer']
        );
        user = newUser.rows[0];
        boutiqueTotalUsers.inc(1); // Increment Prometheus metric
      } else {
        user = result.rows[0];
      }

      currentUser = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        address: user.address
      };

      res.json({
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
        token: user.id.toString(),
        refreshToken: user.id.toString(),
        message: 'Demo login successful'
      });
      return;
    }

    // Normal password check
    const result = await query('SELECT id, email, password_hash, first_name, last_name, role, phone, address, created_at, updated_at FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    currentUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phone: user.phone,
      address: user.address
    };

    res.json({
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
      token: user.id.toString(),
      refreshToken: user.id.toString(),
      message: 'Login successful'
    });
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
    const existingUser = await query(
      'SELECT id, email, first_name, last_name, role, phone, address, created_at, updated_at FROM users WHERE email = $1',
      [payload.email]
    );

    let user = existingUser.rows[0];
    if (!user) {
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      const newUser = await query(
        'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role, phone, address, created_at, updated_at',
        [payload.email, passwordHash, firstName, lastName, 'customer']
      );
      user = newUser.rows[0];
      boutiqueTotalUsers.inc(1);
    }

    currentUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phone: user.phone,
      address: user.address,
    };

    return res.json({
      user: { ...currentUser, createdAt: user.created_at, updatedAt: user.updated_at },
      token: user.id.toString(),
      refreshToken: user.id.toString(),
      message: 'Google login successful',
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(401).json({ error: 'Google sign-in failed' });
  }
});

router.post('/logout', (req, res) => {
  currentUser = null;
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const userId = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!userId || userId === 'undefined') {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, role, phone, address FROM users WHERE id = $1',
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
      address: user.address
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export { router as authRoutes };