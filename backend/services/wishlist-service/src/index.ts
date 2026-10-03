import dotenv from 'dotenv';
dotenv.config();

import { getJwtSecret } from '@boutique/shared';
import { createApp } from './app';
import { pool } from './database/connection';
import { setDatabasePool } from './metrics';

getJwtSecret(); // fail fast if JWT_SECRET is missing in production
setDatabasePool(pool);
const app = createApp();
const port = Number(process.env.PORT) || 3007;

pool.connect().then(client => {
  client.release();
  app.listen(port, '0.0.0.0', () => console.log(`Wishlist service running on port ${port}`));
}).catch(error => {
  console.error('Failed to connect wishlist service database:', error);
  process.exit(1);
});
