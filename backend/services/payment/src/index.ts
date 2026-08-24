import { createApp } from './server/app';
import { config } from './config';

const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Payment service running on port ${config.port}`);
});
