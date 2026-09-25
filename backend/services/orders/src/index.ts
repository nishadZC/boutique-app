import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { orderRoutes } from './routes/orders';
import { adminRoutes } from './routes/admin';
import { internalRoutes } from './routes/internal';
import { getJwtSecret } from './middleware/auth';
import { connectDB } from './database/connection';
import { metricsMiddleware, setupMetrics } from './metrics';

dotenv.config({ path: './.env' });
getJwtSecret(); // fail fast if JWT_SECRET is missing in production

const app = express();
const PORT = process.env.PORT || 3005;

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
app.use(cors());
app.use(express.json());

setupMetrics(app, { serviceName: 'orders', serviceVersion: '1.0.0' });

app.use(metricsMiddleware);

// Specific prefixes before the customer router, whose '/:id' routes would match them.
app.use('/admin', adminRoutes);
app.use('/internal', internalRoutes);
app.use('', orderRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    await connectDB();

    // Initialize metrics
    const { boutiqueTotalOrders, boutiqueTotalRevenue } = require('./metrics');
    const { query } = require('./database/connection');
    try {
      const ordersResult = await query('SELECT count(*) FROM orders');
      boutiqueTotalOrders.set(parseInt(ordersResult.rows[0].count, 10));
      
      // Revenue counts paid orders only.
      const revenueResult = await query("SELECT sum(total_amount) FROM orders WHERE payment_status = 'paid'");
      const revenue = revenueResult.rows[0].sum ? parseFloat(revenueResult.rows[0].sum) : 0;
      boutiqueTotalRevenue.set(revenue);
    } catch (e) {
      console.error('Failed to initialize order metrics:', e);
    }

    app.listen(PORT, () => {
      console.log(`Orders service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start orders service:', error);
    process.exit(1);
  }
};

startServer();
