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
    console.log("Creating ccms_project_work_logs table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ccms_project_work_logs (
        WL_ID INT AUTO_INCREMENT PRIMARY KEY,
        WL_Project_ID VARCHAR(50) NOT NULL,
        WL_User_ID VARCHAR(50) NOT NULL,
        WL_Date DATE NOT NULL,
        WL_Hours DECIMAL(5,2) DEFAULT 0,
        WL_Description TEXT,
        WL_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_project (WL_Project_ID),
        INDEX idx_user (WL_User_ID),
        INDEX idx_date (WL_Date)
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
