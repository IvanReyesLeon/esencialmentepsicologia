require('dotenv').config();
const pool = require('./config/db');

async function verifyMigration() {
    try {
        console.log('Verifying IVA columns...');

        // Check if columns exist and have default 0
        const result = await pool.query(`
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'invoice_submissions' 
            AND column_name IN ('iva_percentage', 'iva_amount')
        `);

        console.log('Schema Info:', result.rows);

        // Check data for existing rows
        const dataCheck = await pool.query(`
            SELECT id, therapist_id, submitted_at, iva_percentage, iva_amount 
            FROM invoice_submissions 
            ORDER BY submitted_at DESC
            LIMIT 5
        `);
        console.log('Recent Invoices Data:', dataCheck.rows);

        const nullCheck = await pool.query(`
            SELECT COUNT(*) FROM invoice_submissions 
            WHERE iva_percentage IS NULL OR iva_amount IS NULL
        `);
        console.log('Rows with null IVA:', nullCheck.rows[0].count);

        if (parseInt(nullCheck.rows[0].count) === 0) {
            console.log('SUCCESS: All invoices have valid IVA values (0 or set).');
        } else {
            console.error('WARNING: Some invoices have NULL IVA values.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verifyMigration();
