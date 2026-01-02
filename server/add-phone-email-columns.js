const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addPhoneEmailColumns() {
    try {
        console.log('Adding phone and email columns to therapist_billing_data...');

        await pool.query(`
            ALTER TABLE therapist_billing_data 
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS email VARCHAR(255);
        `);

        console.log('✅ Columns added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding columns:', error);
        process.exit(1);
    }
}

addPhoneEmailColumns();
