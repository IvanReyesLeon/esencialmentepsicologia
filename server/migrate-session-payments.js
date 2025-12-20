require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function migrateSessionPayments() {
    const client = await pool.connect();

    try {
        console.log('🔧 Migrating session_payments table...\n');

        // Add therapist_id column if not exists
        await client.query(`
            ALTER TABLE session_payments 
            ADD COLUMN IF NOT EXISTS therapist_id INTEGER REFERENCES therapists(id)
        `);
        console.log('✅ Added therapist_id column');

        // Add payment_type column if not exists
        await client.query(`
            ALTER TABLE session_payments 
            ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'pending'
        `);
        console.log('✅ Added payment_type column');

        // Add marked_at column if not exists
        await client.query(`
            ALTER TABLE session_payments 
            ADD COLUMN IF NOT EXISTS marked_at TIMESTAMP
        `);
        console.log('✅ Added marked_at column');

        // Show final structure
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'session_payments'
            ORDER BY ordinal_position
        `);
        console.log('\n📋 Final table structure:');
        console.table(result.rows);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        pool.end();
    }
}

migrateSessionPayments();
