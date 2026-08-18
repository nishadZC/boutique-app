const { Client } = require('pg');

async function fixOrdersDb() {
  const client = new Client({
    user: 'postgres',
    password: 'root',
    host: 'localhost',
    port: 5432,
    database: 'orders_db'
  });

  try {
    await client.connect();
    console.log('Connected to orders_db.');
    
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
    `);
    
    console.log('Successfully added payment_status column to orders table.');
  } catch (err) {
    console.error('Error updating orders table:', err.message);
  } finally {
    await client.end();
  }
}

fixOrdersDb();
