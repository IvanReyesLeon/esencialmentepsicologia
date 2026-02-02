require('dotenv').config();
const pool = require('./config/db');

async function checkConstraints() {
    try {
        const res = await pool.query(`
            SELECT conname, confrelid::regclass
            FROM pg_constraint
            WHERE conrelid = 'invoice_submissions'::regclass
            AND contype = 'f';
        `);
        console.log('Constraints on invoice_submissions:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        // Force exit
        process.exit();
    }
}

checkConstraints();
