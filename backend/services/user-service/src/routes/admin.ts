import { Router } from 'express';
import Joi from 'joi';
import { requireAdmin } from '@boutique/shared';
import { fetchAccountRoles } from '../clients/authService';
import { query } from '../database/connection';
import { PROFILE_COLUMNS, toProfile } from '../profiles';

const guid = Joi.string().guid();

// Mounted at /admin (gateway: /api/users/admin/...)
export const adminRoutes = Router();
adminRoutes.use(requireAdmin);

adminRoutes.get('/customers', async (req, res) => {
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
      query(`SELECT ${PROFILE_COLUMNS} FROM profiles ${where}
             ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, (page - 1) * limit]),
      query(`SELECT COUNT(*) AS total FROM profiles ${where}`, params),
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_30d FROM profiles`),
    ]);
    const total = Number(count.rows[0].total);
    const s = summary.rows[0];
    const accounts = await fetchAccountRoles(rows.rows.map(p => p.user_id));
    res.json({
      success: true,
      data: {
        customers: rows.rows.map(p => ({ ...toProfile(p), role: accounts.roles[p.user_id] ?? 'customer' })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: { totalAccounts: Number(s.total), newLast30Days: Number(s.new_30d), admins: accounts.admins },
      },
    });
  } catch (err) {
    console.error('Admin customers error:', err);
    res.status(500).json({ success: false, error: 'Failed to load customers' });
  }
});

/** Names and contact details for the customers on a page of orders. */
adminRoutes.get('/customers/lookup', async (req, res) => {
  const ids = String(req.query.ids ?? '').split(',').filter(id => !guid.validate(id).error).slice(0, 100);
  if (ids.length === 0) {
    res.json({ success: true, data: {} });
    return;
  }
  try {
    const result = await query('SELECT user_id, email, first_name, last_name, phone FROM profiles WHERE user_id = ANY($1::uuid[])', [ids]);
    const data: Record<string, unknown> = {};
    for (const u of result.rows) data[u.user_id] = { id: u.user_id, email: u.email, firstName: u.first_name, lastName: u.last_name, phone: u.phone };
    res.json({ success: true, data });
  } catch (err) {
    console.error('Admin customer lookup error:', err);
    res.status(500).json({ success: false, error: 'Failed to load customers' });
  }
});
