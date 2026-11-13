const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

let poolConfig;
if (process.env.DATABASE_URL) {
  // Only strip channel_binding which node-postgres doesn't support
  const cleanUrl = process.env.DATABASE_URL
    .replace(/[?&]channel_binding=[^&]*/g, '')
    .replace(/&&/g, '&')
    .replace(/[?&]$/, '');
  const parsed = parse(cleanUrl);
  poolConfig = {
    host: parsed.host,
    port: parsed.port || 5432,
    database: parsed.database,
    user: parsed.user,
    password: parsed.password,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
});

module.exports = pool;
