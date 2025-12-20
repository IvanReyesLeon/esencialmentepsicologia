require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkSessionPayments() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'session_payments'
        `);
        console.log('Session Payments Table Structure:');
        console.table(result.rows);

        // Check constraints
        const constraints = await pool.query(`
            SELECT constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_name = 'session_payments'
        `);
        console.log('\nConstraints:');
        console.table(constraints.rows);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        pool.end();
    }
}

checkSessionPayments();
