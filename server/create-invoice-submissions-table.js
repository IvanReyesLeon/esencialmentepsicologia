const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createInvoiceSubmissionsTable() {
    try {
        console.log('Creating invoice_submissions table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS invoice_submissions (
                id SERIAL PRIMARY KEY,
                therapist_id INTEGER REFERENCES users(id),
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                subtotal NUMERIC(10, 2),
                center_percentage NUMERIC(5, 2),
                center_amount NUMERIC(10, 2),
                irpf_percentage NUMERIC(5, 2),
                irpf_amount NUMERIC(10, 2),
                total_amount NUMERIC(10, 2),
                UNIQUE(therapist_id, month, year)
            );
        `);

        console.log('✅ Table invoice_submissions created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
}

createInvoiceSubmissionsTable();
