
require('dotenv').config();
const { pool } = require('./config/db');

async function checkSchema() {
    try {
        console.log('Checking invoice_submissions schema...');

        // Query to get column names
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'invoice_submissions'
        `);

        console.log('Columns:', res.rows.map(r => r.column_name).join(', '));

        // Also check if the JOIN works
        console.log('Testing JOIN query...');
        const joinRes = await pool.query(`
            SELECT i.id, i.year, t.full_name 
            FROM invoice_submissions i
            JOIN therapists t ON i.therapist_id = t.id
            LIMIT 1
        `);
        console.log(`JOIN result: ${joinRes.rows.length} rows.`);
        if (joinRes.rows.length > 0) console.log(joinRes.rows[0]);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
