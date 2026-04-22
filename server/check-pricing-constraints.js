require('dotenv').config({ path: __dirname + '/.env' });
const { pool } = require('./config/db');

async function checkConstraints() {
    try {
        const res = await pool.query(`
            SELECT conname, contype
            FROM pg_constraint
            WHERE conrelid = 'pricing'::regclass;
        `);
        console.log('Constraints on pricing:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkConstraints();
