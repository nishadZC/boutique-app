const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const schemaFile = path.join(__dirname, '20-init-schema.sql');
  const content = fs.readFileSync(schemaFile, 'utf8');

  // Split by \c and trim
  const parts = content.split(/\\c\s+/).map(s => s.trim()).filter(s => s.length > 0);

  // The first part might be comments before any \c. We only care about parts starting with db name.
  for (const part of parts) {
    if (!part) continue;

    // The first word is the database name, followed by newlines and SQL
    const match = part.match(/^([a-zA-Z0-9_]+)\s+([\s\S]*)/);
    if (!match) continue;

    const dbName = match[1];
    let sql = match[2];

    console.log(`Connecting to database: ${dbName}`);

    // Create DB first if it doesn't exist (using postgres db)
    const clientAdmin = new Client({
      user: 'postgres',
      password: 'root',
      host: 'localhost',
      port: 5432,
      database: 'postgres'
    });

    try {
      await clientAdmin.connect();
      await clientAdmin.query(`CREATE DATABASE ${dbName}`);
      console.log(`Created database ${dbName}`);
    } catch (err) {
      if (err.code !== '42P04') { // Ignore already exists error
        console.error(`Error creating ${dbName}:`, err.message);
      }
    } finally {
      await clientAdmin.end();
    }

    // Now connect to the specific db and run the sql
    const client = new Client({
      user: 'postgres',
      password: 'root',
      host: 'localhost',
      port: 5432,
      database: dbName
    });

    try {
      await client.connect();
      console.log(`Connected to ${dbName}. Running schema...`);
      await client.query(sql);
      console.log(`Schema executed for ${dbName} successfully.`);
    } catch (err) {
      console.error(`Error executing schema on ${dbName}:`, err.message);
    } finally {
      await client.end();
    }
  }
}

run();
