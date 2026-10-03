import http from 'http';
import https from 'https';
import net from 'net';
import dns from 'dns';
import dotenv from 'dotenv';

if (net.setDefaultAutoSelectFamily) {
  net.setDefaultAutoSelectFamily(false);
}
dns.setDefaultResultOrder('ipv4first');
http.globalAgent = new http.Agent({ family: 4 });
https.globalAgent = new https.Agent({ family: 4 });
import { createApp, serviceUrls } from './app';

dotenv.config();

const app = createApp();
const PORT: number = Number(process.env.GATEWAY_PORT) || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Proxying to services:`, serviceUrls());
});
