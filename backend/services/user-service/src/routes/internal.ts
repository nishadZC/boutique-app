import { Router } from 'express';
import Joi from 'joi';
import { requireInternal } from '@boutique/shared';
import { query } from '../database/connection';

const guid = Joi.string().guid();

const newProfileSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).max(255).required(),
  firstName: Joi.string().trim().max(100).allow(''),
  lastName: Joi.string().trim().max(100).allow(''),
});

// Mounted at /internal (service-to-service only)
export const internalRoutes = Router();

internalRoutes.put('/users/:id/profile', requireInternal, async (req, res) => {
  if (guid.validate(req.params.id).error) {
    res.status(400).json({ success: false, error: 'Invalid user id' });
    return;
  }
  const { value, error } = newProfileSchema.validate(req.body, { stripUnknown: true });
  if (error) {
    res.status(400).json({ success: false, error: error.details[0].message.replace(/"/g, '') });
    return;
  }
  try {
    await query(
      'INSERT INTO profiles (user_id, email, first_name, last_name) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO NOTHING',
      [req.params.id, value.email.toLowerCase(), value.firstName, value.lastName]);
    res.json({ success: true });
  } catch (err) {
    console.error('Create profile error:', err);
    res.status(500).json({ success: false, error: 'Failed to create profile' });
  }
});
internalRoutes.get('/users/:id/display-name', requireInternal, async (req, res) => {
  if (guid.validate(req.params.id).error) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  try {
    const result = await query('SELECT first_name, last_name FROM profiles WHERE user_id = $1', [req.params.id]);
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
