require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE || process.env.DATABASE_URL,
    ssl: (process.env.DATABASE || process.env.DATABASE_URL)?.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

const migrate = async () => {
    try {
        await pool.query(`
            ALTER TABLE session_payments 
            ADD COLUMN IF NOT EXISTS payment_date DATE;
        `);
        console.log('Added payment_date column to session_payments');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
};

migrate();
