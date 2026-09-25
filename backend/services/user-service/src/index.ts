import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { pool } from './db';
import { setDatabasePool } from './metrics';
import { getJwtSecret } from './middleware/auth';

getJwtSecret(); // fail fast if JWT_SECRET is missing in production
setDatabasePool(pool);
const port = Number(process.env.PORT) || 3004;
const app = createApp();

pool.connect().then(client => {
  client.release();
  app.listen(port, '0.0.0.0', () => console.log(`User service running on port ${port}`));
}).catch(error => {
  console.error('Failed to connect user service database:', error);
  process.exit(1);
});
