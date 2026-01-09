require('dotenv').config();
const { pool } = require('./config/db');

async function checkTable() {
    try {
        // Get table columns
        const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'payment_audit_log' 
            ORDER BY ordinal_position
        `);
        console.log('=== payment_audit_log COLUMNS ===');
        console.log(cols.rows);

        // Get sample data
        const data = await pool.query('SELECT * FROM payment_audit_log LIMIT 3');
        console.log('\n=== SAMPLE DATA ===');
        console.log(data.rows);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkTable();
