import { createApp } from './server/app';
import { config } from './config';
import { getJwtSecret } from './middleware/auth';

getJwtSecret(); // fail fast if JWT_SECRET is missing in production

const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Payment service running on port ${config.port}`);
});
