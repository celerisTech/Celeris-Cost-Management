const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });

  const host = env.DB_HOST || '127.0.0.1';
  const user = env.DB_USER || env.DB_ROOT || 'root';
  const password = env.DB_PASSWORD || '';
  const database = env.DB_NAME || 'celeris_ccms';

  console.log(`Connecting to database ${database} at ${host} as ${user}...`);
  const connection = await mysql.createConnection({ host, user, password, database });

  try {
    console.log('Altering ccms_sales_lead table to change CM_Lead_Status to VARCHAR(50)...');
    await connection.query(`
      ALTER TABLE ccms_sales_lead 
      MODIFY COLUMN CM_Lead_Status VARCHAR(50) DEFAULT 'New Lead'
    `);
    console.log('Successfully modified CM_Lead_Status column to VARCHAR(50).');
  } catch (err) {
    console.error('Error running migration query:', err);
  } finally {
    await connection.end();
  }
}

run().catch(console.error);
