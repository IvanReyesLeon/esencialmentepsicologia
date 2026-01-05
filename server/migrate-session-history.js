require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function migrateSessionHistory() {
    const client = await pool.connect();

    try {
        console.log('🔧 Migrating session_payments table for session history...\n');

        // Add session_date column (DATE without timezone)
        await client.query(`
            ALTER TABLE session_payments 
            ADD COLUMN IF NOT EXISTS session_date DATE
        `);
        console.log('✅ Added session_date column (DATE)');

        // Add session_title column
        await client.query(`
            ALTER TABLE session_payments 
            ADD COLUMN IF NOT EXISTS session_title VARCHAR(255)
        `);
        console.log('✅ Added session_title column');

        // Add original_price column
        await client.query(`
            ALTER TABLE session_payments 
            ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2) DEFAULT 55.00
        `);
        console.log('✅ Added original_price column');

        // Add modified_price column (NULL if not modified)
        await client.query(`
            ALTER TABLE session_payments 
            ADD COLUMN IF NOT EXISTS modified_price DECIMAL(10, 2)
        `);
        console.log('✅ Added modified_price column');

        // Show final structure
        const result = await client.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'session_payments'
            ORDER BY ordinal_position
        `);
        console.log('\n📋 Final table structure:');
        console.table(result.rows);

        console.log('\n✅ Migration completed successfully!');
        console.log('📝 Note: Only sessions from January 2026 onwards will have the new fields populated.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        pool.end();
    }
}

migrateSessionHistory();
