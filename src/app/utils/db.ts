import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = (globalThis as any).__MYSQL_POOL__ || null;
let migrationsRun = false;

interface DbConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
  connectTimeout: number;
  multipleStatements: boolean;
  dateStrings?: boolean;
  timezone?: string;
  enableKeepAlive?: boolean;
  keepAliveInitialDelay?: number;
}

function createDbPool(config: DbConfig): mysql.Pool {
  return mysql.createPool(config);
}

async function getDb(): Promise<mysql.Pool> {
  const needsPool = !pool;
  const needsMigration = !migrationsRun;

  if (needsPool) {
    const config: DbConfig = {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'celeris_ccms',
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_SIZE || 25),
      queueLimit: 0,
      connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
      multipleStatements: false,
      dateStrings: true,
      timezone: '+00:00',
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    };
    try {
      pool = createDbPool(config);
      (globalThis as any).__MYSQL_POOL__ = pool;
    } catch (poolErr) {
      console.error('❌ Error creating MySQL Pool:', poolErr);
      throw poolErr;
    }
  }

  if (needsMigration && pool) {
    try {
      // Quick test query
      const [rows] = await pool.query('SELECT 1 AS test');
      if (!rows || (Array.isArray(rows) && (rows as any[])[0]?.test !== 1)) {
        throw new Error('Database connection test failed');
      }

      // Auto-migrate: Check/add CM_Proposal_Doc column in ccms_sales_lead table
      try {
        const [columns]: any = await pool.query(`SHOW COLUMNS FROM ccms_sales_lead LIKE 'CM_Proposal_Doc'`);
        if (!columns || columns.length === 0) {
          console.log('Adding CM_Proposal_Doc column to ccms_sales_lead...');
          await pool.query(`ALTER TABLE ccms_sales_lead ADD COLUMN CM_Proposal_Doc LONGTEXT DEFAULT NULL`);
          console.log('✅ CM_Proposal_Doc column added successfully');
        }
      } catch (migrationError) {
        console.error('❌ Auto-migration error for CM_Proposal_Doc:', migrationError);
      }

      // Auto-migrate: Create ccms_sales_lead_projects table if not exists, and seed data
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS ccms_sales_lead_projects (
            CM_Lead_Project_ID INT AUTO_INCREMENT PRIMARY KEY,
            CM_Lead_ID VARCHAR(20) NOT NULL,
            CM_Product_Name VARCHAR(150) NOT NULL,
            CM_Amount DECIMAL(15,2) DEFAULT NULL,
            CM_Proposal_Doc LONGTEXT DEFAULT NULL,
            CM_Status VARCHAR(50) DEFAULT 'New Lead',
            CM_Created_By VARCHAR(20) DEFAULT NULL,
            CM_Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
            CM_Updated_By VARCHAR(20) DEFAULT NULL,
            CM_Updated_At DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
            CM_Is_Deleted TINYINT(1) DEFAULT 0,
            INDEX idx_slp_lead (CM_Lead_ID),
            INDEX idx_slp_deleted (CM_Is_Deleted)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ ccms_sales_lead_projects table verified/created successfully');

        // Drop CM_Project_ID column if it was previously created
        try {
          const [cols]: any = await pool.query(`SHOW COLUMNS FROM ccms_sales_lead_projects LIKE 'CM_Project_ID'`);
          if (cols && cols.length > 0) {
            console.log('Dropping CM_Project_ID column from ccms_sales_lead_projects...');
            await pool.query(`ALTER TABLE ccms_sales_lead_projects DROP COLUMN CM_Project_ID`);
            console.log('✅ CM_Project_ID column dropped successfully');
          }
        } catch (dropErr) {
          console.error('Error dropping CM_Project_ID column:', dropErr);
        }

        // Seed data from existing leads
        const [seedResult]: any = await pool.query(`
          INSERT INTO ccms_sales_lead_projects (CM_Lead_ID, CM_Product_Name, CM_Amount, CM_Proposal_Doc, CM_Status, CM_Created_At)
          SELECT 
            sl.CM_Lead_ID, 
            COALESCE(NULLIF(TRIM(sl.CM_Product_Required), ''), 'Default Product'), 
            COALESCE(sl.CM_Expected_Budget, 0), 
            sl.CM_Proposal_Doc, 
            sl.CM_Lead_Status, 
            sl.CM_Created_At
          FROM ccms_sales_lead sl
          WHERE sl.CM_Is_Deleted = 0 
            AND NOT EXISTS (
              SELECT 1 FROM ccms_sales_lead_projects slp WHERE slp.CM_Lead_ID = sl.CM_Lead_ID
            );
        `);
        if (seedResult && seedResult.affectedRows > 0) {
          console.log(`✅ Seeded ${seedResult.affectedRows} existing leads into ccms_sales_lead_projects`);
        }
      } catch (tableError) {
        console.error('❌ Auto-migration error for ccms_sales_lead_projects:', tableError);
      }

      // Auto-migrate: Create ccms_sales_amc table if not exists
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS ccms_sales_amc (
            CM_AMC_ID INT AUTO_INCREMENT PRIMARY KEY,
            CM_Lead_ID VARCHAR(20) NOT NULL,
            CM_Domain_Link VARCHAR(250) DEFAULT NULL,
            CM_Start_Date DATE DEFAULT NULL,
            CM_Expiry_Date DATE DEFAULT NULL,
            CM_Amount DECIMAL(15,2) DEFAULT NULL,
            CM_Status VARCHAR(50) DEFAULT 'Pending',
            CM_Created_By VARCHAR(20) DEFAULT NULL,
            CM_Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
            CM_Updated_By VARCHAR(20) DEFAULT NULL,
            CM_Updated_At DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
            CM_Is_Deleted TINYINT(1) DEFAULT 0,
            INDEX idx_amc_lead (CM_Lead_ID),
            INDEX idx_amc_expiry (CM_Expiry_Date),
            INDEX idx_amc_status (CM_Status),
            INDEX idx_amc_deleted (CM_Is_Deleted)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ ccms_sales_amc table verified/created successfully');
      } catch (amcTableError) {
        console.error('❌ Auto-migration error for ccms_sales_amc:', amcTableError);
      }

      // Auto-migrate: Add CM_AMC_Type to ccms_sales_amc if not exists
      try {
        const [columns]: any = await pool.query(`SHOW COLUMNS FROM ccms_sales_amc LIKE 'CM_AMC_Type'`);
        if (!columns || columns.length === 0) {
          console.log('Adding CM_AMC_Type column to ccms_sales_amc...');
          await pool.query(`ALTER TABLE ccms_sales_amc ADD COLUMN CM_AMC_Type VARCHAR(50) DEFAULT 'Website'`);
          console.log('✅ CM_AMC_Type column added successfully');
        }
      } catch (amcAlterError) {
        console.error('❌ Auto-migration error for ccms_sales_amc CM_AMC_Type:', amcAlterError);
      }

      // Auto-migrate: Add CM_AMC_ID to ccms_sales_payment if not exists
      try {
        const [columns]: any = await pool.query(`SHOW COLUMNS FROM ccms_sales_payment LIKE 'CM_AMC_ID'`);
        if (!columns || columns.length === 0) {
          console.log('Adding CM_AMC_ID column to ccms_sales_payment...');
          await pool.query(`ALTER TABLE ccms_sales_payment ADD COLUMN CM_AMC_ID INT DEFAULT NULL`);
          console.log('✅ CM_AMC_ID column added successfully');
        }
      } catch (paymentAlterError) {
        console.error('❌ Auto-migration error for ccms_sales_payment CM_AMC_ID:', paymentAlterError);
      }

      // Auto-migrate: Verify and insert Sales AMC nav link
      try {
        const [existingLink]: any = await pool.query(`SELECT CM_Nav_Link_ID FROM ccms_nav_link WHERE CM_Name = 'Sales AMC'`);
        if (!existingLink || existingLink.length === 0) {
          console.log('Inserting Sales AMC nav link into ccms_nav_link...');
          await pool.query(`
            INSERT INTO ccms_nav_link (CM_Name, CM_Path, CM_Section) 
            VALUES ('Sales AMC', '/dashboard/crm/amc', 'Sales')
          `);
          // Get the inserted link ID
          const [insertedLink]: any = await pool.query(`SELECT CM_Nav_Link_ID FROM ccms_nav_link WHERE CM_Name = 'Sales AMC'`);
          if (insertedLink && insertedLink.length > 0) {
            const navLinkId = insertedLink[0].CM_Nav_Link_ID;
            console.log(`Granting Sales AMC privilege to Admin role for link ID: ${navLinkId}`);
            await pool.query(`
              INSERT INTO ccms_privilege_master (CM_Role_ID, CM_Nav_Link_ID)
              VALUES ('ROL000001', ?)
            `, [navLinkId]);
            console.log('✅ Sales AMC privilege granted successfully');
          }
        }
      } catch (navError) {
        console.error('❌ Auto-migration error for Sales AMC nav link:', navError);
      }

      migrationsRun = true;
      console.log('✅ Database auto-migrations applied successfully');
    } catch (migrateErr) {
      console.error('❌ Database migration/initialization error:', migrateErr);
      migrationsRun = false;
    }
  }

  return pool;
}

export async function queryDb(sql: string, params: any[] = []) {
  const activePool = await getDb();
  return activePool.execute(sql, params);
}

export async function getConnection() {
  const activePool = await getDb();
  return activePool.getConnection();
}

export default getDb;
