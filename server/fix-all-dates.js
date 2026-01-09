require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log('--- FIXING NULL SESSION DATES FOR ALL THERAPISTS ---');

        // Update all null session_date to '2026-01-02'
        const res = await pool.query(`
            UPDATE session_payments 
            SET session_date = '2026-01-02' 
            WHERE session_date IS NULL
        `);

        console.log(`✅ Updated ${res.rowCount} records.`);

        // Verify 0 remaining
        const check = await pool.query(`SELECT COUNT(*) FROM session_payments WHERE session_date IS NULL`);
        console.log(`Remaining null records: ${check.rows[0].count}`);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
