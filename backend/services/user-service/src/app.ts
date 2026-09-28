import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import Joi from 'joi';
import { query } from './db';
import { metricsMiddleware, setupMetrics } from './metrics';
import { requireAdmin, requireInternal, requireUser } from './middleware/auth';
import { normalizePhone } from './validation';

const guid = Joi.string().guid();

const profileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  phone: Joi.string().trim().max(20).allow('', null),
  address: Joi.string().trim().max(500).allow('', null),
});

const toUser = (u: any) => ({
  id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name, role: u.role,
  phone: u.phone, address: u.address, createdAt: u.created_at, updatedAt: u.updated_at,
});

export function createApp() {
  const app = express();
  app.use(helmet({ crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' } }));
  app.use(cors());
  app.use(express.json());
  setupMetrics(app, 'user-service');
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => res.status(200).send('OK'));

  // Signed-in only: this spends the Azure Maps subscription.
  app.get('/location/reverse', requireUser, async (req, res) => {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const subscriptionKey = process.env.AZURE_MAPS_SUBSCRIPTION_KEY;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      res.status(400).json({ success: false, error: 'Valid location coordinates are required' });
      return;
    }
    if (!subscriptionKey) {
      res.status(503).json({ success: false, error: 'Location lookup is not configured' });
      return;
    }

    try {
      const url = new URL('https://atlas.microsoft.com/search/address/reverse/json');
      url.searchParams.set('api-version', '1.0');
      url.searchParams.set('query', `${latitude},${longitude}`);
      url.searchParams.set('subscription-key', subscriptionKey);
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        res.status(502).json({ success: false, error: 'Unable to find your current address' });
        return;
      }
      const data = await response.json() as { addresses?: Array<{ address?: Record<string, string> }> };
      const address = data.addresses?.[0]?.address;
      if (!address) {
        res.status(404).json({ success: false, error: 'No address found for your current location' });
        return;
      }
      res.json({ success: true, data: {
        houseNumber: address.streetNumber || '',
        street: address.streetName || '',
        city: address.municipality || '',
        state: address.countrySubdivision || '',
        postalCode: address.postalCode || '',
        country: address.country || 'India',
      } });
    } catch (error) {
      console.error('Azure Maps reverse geocoding error:', error);
      res.status(502).json({ success: false, error: 'Unable to find your current address' });
    }
  });

  app.put('/profile', requireUser, async (req, res) => {
    const { value, error } = profileSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      res.status(400).json({ error: error.details.map(d => d.message.replace(/"/g, '')).join('; ') });
      return;
    }
    // Phone is optional; when given it must be a valid Indian mobile number and is stored as E.164.
    const rawPhone = value.phone ?? '';
    const phone = rawPhone ? normalizePhone(rawPhone) : null;
    if (rawPhone && !phone) {
      res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
      return;
    }

    try {
      const result = await query(
        'UPDATE users SET first_name = $1, last_name = $2, phone = $3, address = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, email, first_name, last_name, role, phone, address, created_at, updated_at',
        [value.firstName, value.lastName, phone, value.address || null, req.auth!.userId]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json(toUser(result.rows[0]));
    } catch (err) {
      console.error('Profile update error:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // ---- Admin (gateway: /api/users/admin/...) ----
  const admin = express.Router();
  admin.use(requireAdmin);

  admin.get('/customers', async (req, res) => {
    const page = Math.max(Number.parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '25'), 10) || 25, 1), 100);
    const search = String(req.query.search ?? '').trim().slice(0, 100);
    const params: unknown[] = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR phone ILIKE $1`;
    }
    try {
      const [rows, count, summary] = await Promise.all([
        query(`SELECT id, email, first_name, last_name, role, phone, created_at, updated_at FROM users ${where}
               ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, (page - 1) * limit]),
        query(`SELECT COUNT(*) AS total FROM users ${where}`, params),
        query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_30d,
                      COUNT(*) FILTER (WHERE role = 'admin') AS admins FROM users`),
      ]);
      const total = Number(count.rows[0].total);
      const s = summary.rows[0];
      res.json({
        success: true,
        data: {
          customers: rows.rows.map(toUser),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
          summary: { totalAccounts: Number(s.total), newLast30Days: Number(s.new_30d), admins: Number(s.admins) },
        },
      });
    } catch (err) {
      console.error('Admin customers error:', err);
      res.status(500).json({ success: false, error: 'Failed to load customers' });
    }
  });

  /** Names and contact details for the customers on a page of orders. */
  admin.get('/customers/lookup', async (req, res) => {
    const ids = String(req.query.ids ?? '').split(',').filter(id => !guid.validate(id).error).slice(0, 100);
    if (ids.length === 0) {
      res.json({ success: true, data: {} });
      return;
    }
    try {
      const result = await query('SELECT id, email, first_name, last_name, phone FROM users WHERE id = ANY($1::uuid[])', [ids]);
      const data: Record<string, unknown> = {};
      for (const u of result.rows) data[u.id] = { id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name, phone: u.phone };
      res.json({ success: true, data });
    } catch (err) {
      console.error('Admin customer lookup error:', err);
      res.status(500).json({ success: false, error: 'Failed to load customers' });
    }
  });
  app.use('/admin', admin);

  // ---- Internal (service-to-service) ----
  app.get('/internal/users/:id/display-name', requireInternal, async (req, res) => {
    if (guid.validate(req.params.id).error) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    try {
      const result = await query('SELECT first_name, last_name FROM users WHERE id = $1', [req.params.id]);
      const u = result.rows[0];
      if (!u) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      // Public reviews show a first name and last initial only.
      const displayName = [u.first_name, u.last_name ? `${String(u.last_name)[0]}.` : ''].filter(Boolean).join(' ') || 'Verified buyer';
      res.json({ success: true, data: { displayName } });
    } catch (err) {
      console.error('Display name error:', err);
      res.status(500).json({ success: false, error: 'Failed to load user' });
    }
  });

  return app;
}
