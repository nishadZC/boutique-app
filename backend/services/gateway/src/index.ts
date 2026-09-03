import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import http from 'http';
import https from 'https';
import dns from 'dns';
import dotenv from 'dotenv';

http.globalAgent = new http.Agent({ family: 4 });
https.globalAgent = new https.Agent({ family: 4 });
dns.setDefaultResultOrder('ipv4first');
import { metricsMiddleware, setupMetrics } from './metrics';

dotenv.config();

const app = express();
const PORT: number = Number(process.env.GATEWAY_PORT) || 3001;

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
app.use(cors());

setupMetrics(app, { serviceName: 'gateway', serviceVersion: '1.0.0' });

app.use(metricsMiddleware);

const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
  users: process.env.USER_SERVICE_URL || 'http://localhost:3004',
  products: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3003',
  orders: process.env.ORDERS_SERVICE_URL || 'http://localhost:3005',
  payments: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3006',
  wishlist: process.env.WISHLIST_SERVICE_URL || 'http://localhost:3007',
};

app.use('/api/auth', createProxyMiddleware({
  target: services.auth,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' },
}));

app.use('/api/users', createProxyMiddleware({
  target: services.users,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
}));
app.use('/api/products', createProxyMiddleware({
  target: services.products,
  changeOrigin: true,
  pathRewrite: { '^/api/products': '' },
}));

app.use('/api/orders', createProxyMiddleware({
  target: services.orders,
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '' },
}));

app.use('/api/payments', createProxyMiddleware({
  target: services.payments,
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '' },
}));

app.use('/api/wishlist', createProxyMiddleware({
  target: services.wishlist,
  changeOrigin: true,
  pathRewrite: { '^/api/wishlist': '/wishlist' },
}));

// POST /api/recommendations → Express product-service (which internally calls FastAPI)
app.use('/api/recommendations', createProxyMiddleware({
  target: services.products,
  changeOrigin: true,
  pathRewrite: { '^/api/recommendations': '/recommendations' },
}));

// Root health check for Azure App Gateway
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Path-specific health check for Azure App Gateway
app.get('/api', (req, res) => {
  res.status(200).send('OK');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Service not found' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Proxying to services:`, services);
});