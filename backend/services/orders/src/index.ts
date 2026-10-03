import * as dotenv from 'dotenv';
import { getJwtSecret } from '@boutique/shared';
import { connectDB } from './database/connection';
import { createApp } from './app';

dotenv.config({ path: './.env' });
getJwtSecret(); // fail fast if JWT_SECRET is missing in production

const app = createApp();
const PORT = process.env.PORT || 3005;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Orders service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start orders service:', error);
    process.exit(1);
  }
};

startServer();
