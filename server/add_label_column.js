require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration...');
        await pool.query(`
      ALTER TABLE therapists 
      ADD COLUMN IF NOT EXISTS label VARCHAR(255);
    `);
        console.log('Migration successful: label column added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

migrate();
