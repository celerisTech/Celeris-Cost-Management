// // src/app/utils/db.ts
// import mysql from 'mysql2/promise';

// let db: mysql.Pool | null = null;

// interface DbConfig {
//   host: string;
//   user: string;
//   password: string;
//   database: string;
//   waitForConnections: boolean;
//   connectionLimit: number;
//   queueLimit: number;
//   connectTimeout: number;
//   multipleStatements: boolean;
// }

// function createDbPool(): mysql.Pool {
//   const config: DbConfig = {
//     host: process.env.DB_HOST || '127.0.0.1', // use 127.0.0.1 for TCP, not localhost
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD || '',
//     database: process.env.DB_NAME || 'cost_management',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0,
//     connectTimeout: 10000, // 10 seconds
//     multipleStatements: false,
//   };

//   const pool = mysql.createPool(config);

//   // Error listener
//   (pool as any).on?.('error', (err: any) => {
//     console.error('MySQL pool error:', err);
//     if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//       console.warn('MySQL connection lost. Reinitializing pool...');
//       db = null; // next getDb() will reinit
//     }
//   });

//   return pool;
// }

// export async function getDb(): Promise<mysql.Pool> {
//   try {
//     if (!db) {
//       db = createDbPool();
//       const [rows] = await db.query('SELECT 1 AS test');
//       if (!rows || (rows as any[])[0]?.test !== 1) {
//         throw new Error('Database connection test failed');
//       }
//       console.log('✅ Database pool created successfully');
//     }
//     return db;
//   } catch (err) {
//     console.error('❌ Failed to connect to database:', err);
//     db = null;
//     throw err;
//   }
// }

// export default getDb;


import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = (globalThis as any).__MYSQL_POOL__ || null;

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
  dateStrings?: boolean;  // ✅ Added
  timezone?: string;   
}

function createDbPool(config: DbConfig): mysql.Pool {
  return mysql.createPool(config);
}

async function getDb(): Promise<mysql.Pool> {
  if (pool) return pool;

  const config: DbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'celeris_ccms',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    queueLimit: 0,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
    multipleStatements: false,
    dateStrings: true,       // ✅ critical fix
    timezone: '+00:00'
  };

  try {
    pool = createDbPool(config);

    // Test connection
    const [rows] = await pool.query('SELECT 1 AS test');
    if (!rows || (Array.isArray(rows) && (rows as any[])[0]?.test !== 1)) {
      throw new Error('Database connection test failed');
    }

    (globalThis as any).__MYSQL_POOL__ = pool;
    console.log('✅ MySQL pool created successfully');
    return pool;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    pool = null;
    (globalThis as any).__MYSQL_POOL__ = null;
    throw error;
  }
}

// Execute a query directly
export async function queryDb(sql: string, params: any[] = []) {
  const activePool = await getDb();
  return activePool.execute(sql, params);
}

// Get a raw connection if needed
export async function getConnection() {
  const activePool = await getDb();
  return activePool.getConnection();
}

// ✅ Default export (for compatibility with your existing imports)
export default getDb;

// // src/app/utils/db.ts
// import mysql from 'mysql2/promise';
// import { NextResponse } from 'next/server';

// interface DbConfig {
//   host: string;
//   user: string;
//   password: string;
//   database: string;
//   waitForConnections: boolean;
//   connectionLimit: number;
//   queueLimit: number;
//   connectTimeout: number;
//   multipleStatements: boolean;

// }

// // Global pool reference (maintained between requests)
// let db: mysql.Pool | null = null;

// // Track connection failures to avoid repeated connection attempts in a short period
// let lastFailure: number = 0;
// const FAILURE_COOLDOWN: number = 10000; // 10 seconds

// const createDbPool = (config: DbConfig): mysql.Pool => {
//   return mysql.createPool({
//     ...config,
//     // Enable connection enhancements
//     enableKeepAlive: true,
//     keepAliveInitialDelay: 10000, // 10 seconds
//     namedPlaceholders: true,      // More efficient prepared statements
//   });
// };

// // Track active requests to prioritize critical operations
// const activeRequests = {
//   count: 0,
//   increment() { this.count++; },
//   decrement() { if (this.count > 0) this.count--; },
//   get isBusy() { return this.count > 50; } // Arbitrary threshold
// };

// async function getDbConnection(): Promise<mysql.Pool> {
//   // Quick return if pool exists
//   if (db) {
//     return db;
//   }

//   // Connection failure backoff
//   if (lastFailure && Date.now() - lastFailure < FAILURE_COOLDOWN) {
//     throw new Error('Database connection recently failed, waiting before retry');
//   }

//   const config: DbConfig = {
//     host: process.env.DB_HOST || 'localhost',
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD || '',
//     database: process.env.DB_NAME || 'cost_management',
//     waitForConnections: true,
//     connectionLimit: 25,         // Increased from 10 for better concurrency
//     queueLimit: 10,              // Prevent unlimited queuing
//     connectTimeout: 30000,       // Reduced to 30 seconds (1 hour is excessive)
//     multipleStatements: true,
//     dateStrings: true,       // ✅ critical fix
//     timezone: '+00:00'
//   };

//   try {
//     // Create the pool
//     db = createDbPool(config);

//     // Test connection with timeout
//     const connectionTestTimeout = new Promise((_, reject) => {
//       setTimeout(() => reject(new Error('Database connection test timed out')), 5000);
//     });

//     const connectionTest = db.query('SELECT 1 AS test');

//     // Race the connection test against the timeout
//     const [rows] = await Promise.race([
//       connectionTest,
//       connectionTestTimeout
//     ]) as any;

//     if (!rows || rows[0]?.test !== 1) {
//       throw new Error('Database connection test failed');
//     }

//     console.log('Database connection established successfully');

//     // Reset failure tracking
//     lastFailure = 0;

//     return db;
//   } catch (error) {
//     console.error('Database connection error:', error);
//     // Track failure time
//     lastFailure = Date.now();
//     // Clean up failed connection
//     if (db) {
//       try {
//         await db.end();
//       } catch (e) {
//         console.error('Error closing failed connection:', e);
//       }
//     }
//     db = null;
//     throw error;
//   }
// }

// // Exported function with request tracking
// export default async function getDb(): Promise<mysql.Pool> {
//   activeRequests.increment();

//   try {
//     const pool = await getDbConnection();

//     // If system is under heavy load, validate the connection
//     if (activeRequests.isBusy && db) {
//       try {
//         // Quick health check
//         await db.query('SELECT 1');
//       } catch (e) {
//         // Connection is bad, reset it
//         console.warn('Connection validation failed, recreating pool');
//         try { await db.end(); } catch { }
//         db = null;
//         return await getDbConnection();
//       }
//     }

//     return pool;
//   } catch (error) {
//     console.error('Failed to get database connection:', error);
//     throw new Error('Database connection failed');
//   } finally {
//     activeRequests.decrement();
//   }
// }

// // Add a helper method to explicitly close connections when needed
// export async function closeDbConnections(): Promise<void> {
//   if (db) {
//     try {
//       await db.end();
//       db = null;
//       console.log('Database connections closed');
//     } catch (error) {
//       console.error('Error closing database connections:', error);
//       throw error;
//     }
//   }
// }
