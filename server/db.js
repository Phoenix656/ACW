/**
 * Database connection pool for the Alert System server.
 * Uses environment variables for connection details.
 * Expected variables (defined in a .env file at the project root):
 *   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'acw',
  // Optional: configure max connections, idle timeout etc.
});

// Export a thin wrapper that logs queries in dev mode
module.exports = {
  query: async (text, params) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executing query:', text, params || []);
    }
    return pool.query(text, params);
  },
  // expose the raw pool for advanced use (transactions, etc.)
  getPool: () => pool,
};
