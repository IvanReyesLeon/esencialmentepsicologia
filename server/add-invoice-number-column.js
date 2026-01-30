const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addInvoiceNumberColumn() {
    try {
        console.log('Adding invoice_number column to invoice_submissions...');

        await pool.query(`
            ALTER TABLE invoice_submissions 
            ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);
        `);

        console.log('✅ Column invoice_number added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding column:', error);
        process.exit(1);
    }
}

addInvoiceNumberColumn();
