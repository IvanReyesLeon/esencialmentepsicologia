require('dotenv').config({ path: 'server/.env' });
const pool = require('./config/db');

const addValidationColumns = async () => {
    try {
        console.log('Adding validation columns to invoice_submissions...');

        await pool.query(`
            ALTER TABLE invoice_submissions 
            ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS payment_date DATE;
        `);

        console.log('✅ Columns "validated" and "payment_date" added successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error altering table:', error);
        process.exit(1);
    }
};

addValidationColumns();
