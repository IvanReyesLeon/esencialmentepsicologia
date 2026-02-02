require('dotenv').config();
const pool = require('./config/db');

async function fix() {
    try {
        console.log('Dropping incorrect constraint...');
        await pool.query('ALTER TABLE invoice_submissions DROP CONSTRAINT IF EXISTS invoice_submissions_therapist_id_fkey');

        console.log('Adding correct constraint...');
        await pool.query('ALTER TABLE invoice_submissions ADD CONSTRAINT invoice_submissions_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE');

        console.log('Success!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

fix();
