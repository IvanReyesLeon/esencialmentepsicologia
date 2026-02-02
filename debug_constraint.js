require('dotenv').config({ path: './server/.env' });
const pool = require('./server/config/db');

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
        // pool.end() might be needed if the pool doesn't auto-close, but usually process exit handles it or we force it.
        // For this script, we can just exit.
        process.exit();
    }
}

checkConstraints();
