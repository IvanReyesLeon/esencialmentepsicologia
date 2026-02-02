const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./config/db');

const migrate = async () => {
    try {
        console.log('Starting migration to add excluded_session_ids to invoice_submissions...');

        // Add column if it doesn't exist
        await pool.query(`
            ALTER TABLE invoice_submissions 
            ADD COLUMN IF NOT EXISTS excluded_session_ids JSONB DEFAULT '[]'
        `);

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
