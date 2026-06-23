const mysql = require('mysql2/promise');
async function run() {
    const conn = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '123456',
        database: 'celeris_ccms'
    });
    
    console.log("Creating ccms_visit_status_type table...");
    await conn.execute(`
        CREATE TABLE IF NOT EXISTS ccms_visit_status_type (
            Status_ID INT AUTO_INCREMENT PRIMARY KEY,
            Status_Name VARCHAR(100) NOT NULL UNIQUE,
            Color_Code VARCHAR(100) NOT NULL DEFAULT 'blue',
            Is_Active TINYINT(1) DEFAULT 1,
            Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
            Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    console.log("Seeding initial data...");
    await conn.execute(`
        INSERT IGNORE INTO ccms_visit_status_type (Status_Name, Color_Code) VALUES 
        ('Follow-up Needed', 'blue'),
        ('Interested', 'emerald'),
        ('Not Interested', 'red'),
        ('Proposal Sent', 'amber'),
        ('Converted', 'indigo'),
        ('Call', 'purple')
    `);

    console.log("Altering ccms_sales_visit table...");
    await conn.execute("ALTER TABLE ccms_sales_visit MODIFY COLUMN CM_Visit_Status VARCHAR(100) DEFAULT 'Follow-up Needed'");
    
    try {
        await conn.execute("ALTER TABLE ccms_sales_visit ADD COLUMN CM_Visit_Products VARCHAR(255) DEFAULT NULL AFTER CM_Visit_Status");
        console.log("Added CM_Visit_Products to ccms_sales_visit");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("CM_Visit_Products already exists in ccms_sales_visit");
        } else {
            throw e;
        }
    }

    try {
        await conn.execute("ALTER TABLE ccms_sales_visit ADD COLUMN CM_Visit_Time TIME DEFAULT NULL AFTER CM_Visit_Date");
        console.log("Added CM_Visit_Time to ccms_sales_visit");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("CM_Visit_Time already exists in ccms_sales_visit");
        } else {
            throw e;
        }
    }

    console.log("Creating ccms_visit_products table...");
    await conn.execute(`
        CREATE TABLE IF NOT EXISTS ccms_visit_products (
            Product_ID INT AUTO_INCREMENT PRIMARY KEY,
            Product_Name VARCHAR(200) NOT NULL UNIQUE,
            Color_Code VARCHAR(100) NOT NULL DEFAULT 'blue',
            Is_Active TINYINT(1) DEFAULT 1,
            Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
            Updated_At DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    console.log("Seeding initial product data...");
    await conn.execute(`
        INSERT IGNORE INTO ccms_visit_products (Product_Name, Color_Code) VALUES 
        ('ERP System', 'indigo'),
        ('CRM Software', 'emerald'),
        ('Cloud Hosting', 'blue'),
        ('Consulting Services', 'purple')
    `);
    
    console.log('Schema updated successfully');
    conn.end();
}
run().catch(console.error);
