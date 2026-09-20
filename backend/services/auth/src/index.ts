import http from 'http';
import https from 'https';
import net from 'net';
import dns from 'dns';
import * as dotenv from 'dotenv';

if (net.setDefaultAutoSelectFamily) {
  net.setDefaultAutoSelectFamily(false);
}
dns.setDefaultResultOrder('ipv4first');
http.globalAgent = new http.Agent({ family: 4 });
https.globalAgent = new https.Agent({ family: 4 });
import { createApp } from './app';
import { connectDB } from './database/connection';

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 3002;

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