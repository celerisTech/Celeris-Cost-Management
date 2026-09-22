const mysql = require('mysql2/promise');

async function createTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'celeris_ccms',
    port: 3306,
  });

  try {
    console.log("Creating ccms_standalone_invoices table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ccms_standalone_invoices (
        id VARCHAR(50) PRIMARY KEY,
        client_name VARCHAR(255),
        salutation VARCHAR(50),
        company_name VARCHAR(255),
        phone VARCHAR(50),
        total_cost DECIMAL(15,2),
        proposal_given VARCHAR(50),
        status VARCHAR(100),
        date VARCHAR(50),
        full_data JSON
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table created successfully.");
  } catch (err) {
    console.error("Failed to create table:", err);
  } finally {
    await connection.end();
  }
}

createTable();
