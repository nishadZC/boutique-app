import { createApp } from './app';
import { config } from './config';
import { getJwtSecret } from '@boutique/shared';

getJwtSecret(); // fail fast if JWT_SECRET is missing in production

const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Payment service running on port ${config.port}`);
});
