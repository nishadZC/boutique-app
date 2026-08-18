const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'auth_db',
  user: 'postgres',
  password: 'root',
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to auth_db.');

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS address TEXT;
    `);

    console.log('Successfully added phone and address columns to users table.');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    await client.end();
  }
}

run();
