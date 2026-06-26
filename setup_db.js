require('dotenv').config();
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('Warning: DATABASE_URL environment variable is not set. Database setup cannot proceed.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  date VARCHAR(10) NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  expected_category VARCHAR(100) NOT NULL,
  actual_category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Pendente'
);
`;

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected successfully. Creating table if it doesn\'t exist...');
    await client.query(createTableQuery);
    console.log('Table "transactions" created or already exists.');
    client.release();
  } catch (error) {
    console.error('Error setting up the database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
