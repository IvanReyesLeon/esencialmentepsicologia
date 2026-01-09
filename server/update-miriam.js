require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const res = await pool.query(`
            UPDATE session_payments 
            SET session_date = '2026-01-02' 
            WHERE therapist_id = 5 
              AND session_date IS NULL
        `);
        console.log('Updated rows:', res.rowCount);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
