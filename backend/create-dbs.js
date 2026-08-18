const { Client } = require('pg');

async function createDatabases() {
  const client = new Client({
    user: 'postgres',
    password: 'root',
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Connect to default database
  });

  try {
    await client.connect();
    console.log('Connected to default postgres database.');

    const databases = ['boutique_auth', 'orders_db', 'products_db', 'users_db'];

    for (const db of databases) {
      try {
        await client.query(`CREATE DATABASE ${db}`);
        console.log(`Database '${db}' created successfully.`);
      } catch (err) {
        if (err.code === '42P04') {
          console.log(`Database '${db}' already exists.`);
        } else {
          console.error(`Error creating database '${db}':`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('Failed to connect to postgres. Please ensure it is running and credentials are correct.', err.message);
  } finally {
    await client.end();
  }
}

createDatabases();
