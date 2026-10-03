import { Router } from 'express';
import Joi from 'joi';
import { requireUser } from '@boutique/shared';
import { query } from '../database/connection';
import { PROFILE_COLUMNS, toProfile } from '../profiles';
import { normalizePhone } from '../validation';

const profileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  phone: Joi.string().trim().max(20).allow('', null),
  address: Joi.string().trim().max(500).allow('', null),
});

export const profileRoutes = Router();

profileRoutes.get('/profile', requireUser, async (req, res) => {
  const { userId, email } = req.auth!;
  try {
    const result = await query(`SELECT ${PROFILE_COLUMNS} FROM profiles WHERE user_id = $1`, [userId]);
    res.json(toProfile(result.rows[0] ?? { user_id: userId, email }));
  } catch (err) {
    console.error('Profile load error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

profileRoutes.put('/profile', requireUser, async (req, res) => {
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

  const { userId, email } = req.auth!;
  try {
    const result = await query(
      `INSERT INTO profiles (user_id, email, first_name, last_name, phone, address) VALUES ($5, $6, $1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET first_name = $1, last_name = $2, phone = $3, address = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING ${PROFILE_COLUMNS}`,
      [value.firstName, value.lastName, phone, value.address || null, userId, email ?? '']
    );
    res.json(toProfile(result.rows[0]));
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
