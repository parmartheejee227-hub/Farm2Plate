/**
 * Farm2Plate - Database Initialization Script
 * Loads backend/schema.sql into the connected PostgreSQL database.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function initDb() {
  const connectionString = process.env.DATABASE_URL || {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'farm2plate',
  };

  console.log('[Init-DB] Attempting to connect to PostgreSQL...');
  const client = new Client(connectionString);

  try {
    await client.connect();
    console.log('[Init-DB] Successfully connected to PostgreSQL.');

    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('[Init-DB] Executing schema.sql with tables and realistic seed data...');
    await client.query(sql);

    console.log('[Init-DB] Schema applied and seed data inserted successfully!');
    console.log('[Init-DB] Tables ready: users, delivery_clusters, harvest_batches, orders.');
  } catch (err) {
    console.error('[Init-DB] Error running schema.sql:', err.message);
    console.log('\nTIP: Ensure PostgreSQL service is running and database "farm2plate" exists.');
    console.log('You can create it via: psql -U postgres -c "CREATE DATABASE farm2plate;"');
  } finally {
    await client.end().catch(() => {});
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
