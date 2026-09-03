import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import https from 'https';
import dns from 'dns';
import * as dotenv from 'dotenv';

http.globalAgent.options.family = 4;
https.globalAgent.options.family = 4;
dns.setDefaultResultOrder('ipv4first');
import { authRoutes } from './routes/auth';
import { connectDB } from './database/connection';
import { metricsMiddleware, setupMetrics } from './metrics';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
app.use(cors());
app.use(express.json());

setupMetrics(app, { serviceName: 'auth', serviceVersion: '1.0.0' });

app.use(metricsMiddleware);

app.use('', authRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    await connectDB();
    
    // Initialize the total users metric
    const { boutiqueTotalUsers } = require('./metrics');
    const { query } = require('./database/connection');
    try {
      const result = await query('SELECT count(*) FROM users');
      boutiqueTotalUsers.set(parseInt(result.rows[0].count, 10));
    } catch (e) {
      console.error('Failed to initialize boutique_total_users metric:', e);
    }

    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start auth service:', error);
    process.exit(1);
  }
};

startServer();