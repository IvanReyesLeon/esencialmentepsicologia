require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log('--- THERAPISTS ---');
        const therapists = await pool.query("SELECT id, full_name as name FROM therapists WHERE full_name ILIKE '%Miriam%'");
        console.table(therapists.rows);

        if (therapists.rows.length > 0) {
            const miriamId = therapists.rows[0].id;
            console.log(`\n--- PAYMENTS FOR MIRIAM (ID: ${miriamId}) ---`);
            const payments = await pool.query(`
                SELECT id, event_id, payment_type, therapist_id, reviewed_at, session_date
                FROM session_payments 
                WHERE therapist_id = $1 
                ORDER BY created_at DESC 
                LIMIT 5
            `, [miriamId]);
            console.table(payments.rows);

            console.log(`\n--- PAYMENTS (ALL) for date 2026-01-02 ---`);
            const paymentsDate = await pool.query(`
                SELECT id, event_id, payment_type, therapist_id, reviewed_at, session_date
                FROM session_payments 
                WHERE session_date = '2026-01-02'
            `);
            console.table(paymentsDate.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
