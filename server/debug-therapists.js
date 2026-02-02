
require('dotenv').config();
const { pool } = require('./config/db');

async function checkTherapistsSchema() {
    try {
        console.log('Checking therapists schema...');

        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'therapists'
        `);

        console.log('Columns:', res.rows.map(r => r.column_name).join(', '));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkTherapistsSchema();
