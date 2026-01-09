require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log('--- CHECKING NULL SESSION DATES ---');
        const res = await pool.query(`
            SELECT 
                sp.therapist_id, 
                t.full_name,
                COUNT(*) as count
            FROM session_payments sp
            LEFT JOIN therapists t ON sp.therapist_id = t.id
            WHERE sp.session_date IS NULL
            GROUP BY sp.therapist_id, t.full_name
        `);

        if (res.rows.length === 0) {
            console.log('✅ No records found with NULL session_date.');
        } else {
            console.table(res.rows);
            console.log('⚠️ Found records with NULL session_date. These will not appear in date-filtered views.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
