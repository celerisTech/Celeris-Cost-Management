const mysql = require('mysql2/promise');

async function fixCollation() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'celeris_ccms',
    port: 3306,
  });

  try {
    console.log("Fixing collation for ccms_project_work_logs table...");
    await connection.execute(`
      ALTER TABLE ccms_project_work_logs CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
    `);
    console.log("Collation fixed successfully.");
  } catch (err) {
    console.error("Failed to fix collation:", err);
  } finally {
    await connection.end();
  }
}

fixCollation();
