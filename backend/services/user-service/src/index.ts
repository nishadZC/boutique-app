import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { Pool } from 'pg';
import { metricsMiddleware, setDatabasePool, setupMetrics } from './metrics';

dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
setDatabasePool(pool);
const app = express();
const port = Number(process.env.PORT) || 3004;

app.use(helmet());
app.use(cors());
app.use(express.json());
setupMetrics(app, 'user-service');
app.use(metricsMiddleware);

app.get('/health', (_req, res) => res.status(200).send('OK'));
app.get('/location/reverse', async (req, res) => {
  const { latitude, longitude } = req.query;
  const subscriptionKey = process.env.AZURE_MAPS_SUBSCRIPTION_KEY;
  if (!subscriptionKey || latitude === undefined || longitude === undefined) {
    res.status(400).json({ success: false, error: 'Location coordinates and Azure Maps configuration are required' });
    return;
  }

  try {
    const url = new URL('https://atlas.microsoft.com/search/address/reverse/json');
    url.searchParams.set('api-version', '1.0');
    url.searchParams.set('query', `${latitude},${longitude}`);
    url.searchParams.set('subscription-key', subscriptionKey);
    const response = await fetch(url);
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
app.put('/profile', async (req, res) => {
  const userId = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.substring(7)
    : undefined;
  if (!userId || userId === 'undefined') {
    res.status(401).json({ error: 'Not logged in' });
    return;
  }

  try {
    const { firstName, lastName, phone, address } = req.body;
    const result = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, phone = $3, address = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, email, first_name, last_name, role, phone, address, created_at, updated_at',
      [firstName, lastName, phone, address, userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const user = result.rows[0];
    res.json({ id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role, phone: user.phone, address: user.address, createdAt: user.created_at, updatedAt: user.updated_at });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

pool.connect().then(client => {
  client.release();
  app.listen(port, '0.0.0.0', () => console.log(`User service running on port ${port}`));
}).catch(error => {
  console.error('Failed to connect user service database:', error);
  process.exit(1);
});