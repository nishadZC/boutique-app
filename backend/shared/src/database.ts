import { Pool } from 'pg';
import { setDatabasePool } from './metrics';

export interface DatabaseOptions {
  // Database used when DATABASE_URL is not set (local development).
  defaultDatabase: string;
  // Shown in the startup log, e.g. "orders service".
  label?: string;
}

// One connection pool per service. Returns connectDB / query / getPool so a service's
// database/connection.ts stays a two-line file.
export function createDatabase({ defaultDatabase, label }: DatabaseOptions) {
  let pool: Pool | undefined;

  const connectDB = async (): Promise<void> => {
    try {
      // Use DATABASE_URL if available, otherwise fall back to individual env vars
      const databaseUrl = process.env.DATABASE_URL;
      const common = { max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000 };
      pool = databaseUrl
        ? new Pool({ connectionString: databaseUrl, ...common })
        : new Pool({
          host: process.env.DB_HOST || 'localhost',
          port: Number.parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME || defaultDatabase,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD,
          ...common,
        });

      setDatabasePool(pool);
      await pool.query('SELECT NOW()');
      console.log(`Connected to PostgreSQL database${label ? ` for ${label}` : ''}`);
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  };

  const query = (text: string, params?: any[]): Promise<any> => {
    if (!pool) {
      throw new Error('Database not connected');
    }
    return pool.query(text, params);
  };

  const getPool = (): Pool => {
    if (!pool) {
      throw new Error('Database not connected');
    }
    return pool;
  };

  return { connectDB, query, getPool };
}
