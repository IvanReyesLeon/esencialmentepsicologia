require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting Payment Review Migration...\n');

        // Add reviewed_at and reviewed_by columns for admin review tracking
        console.log('📋 Adding reviewed_at column...');
        await client.query(`
            ALTER TABLE session_payments 
            ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP
        `);

        console.log('📋 Adding reviewed_by column...');
        await client.query(`
            ALTER TABLE session_payments 
            ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id)
        `);

        // Verify columns
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'session_payments'
            ORDER BY ordinal_position
        `);

        console.log('\n📊 session_payments columns:');
        result.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });

        console.log('\n✅ Payment Review Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
