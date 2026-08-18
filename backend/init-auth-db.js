const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runSchema() {
  const client = new Client({
    user: 'postgres',
    password: 'root',
    host: 'localhost',
    port: 5432,
    database: 'boutique_auth',
  });

  try {
    await client.connect();
    console.log('Connected to boutique_auth database.');
    
    const schemaPath = path.join(__dirname, 'services', 'auth', 'src', 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(sql);
    console.log('Auth schema executed successfully.');
  } catch (err) {
    console.error('Error running auth schema:', err);
  } finally {
    await client.end();
  }
}

runSchema();
