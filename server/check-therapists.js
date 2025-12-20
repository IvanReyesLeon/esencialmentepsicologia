require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkTherapists() {
  const result = await pool.query('SELECT id, full_name, calendar_color_id FROM therapists ORDER BY full_name');
  console.table(result.rows);
  pool.end();
}

checkTherapists();
