require('dotenv').config();
const { pool } = require('./config/db');

const createTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sent_reminder_emails (
                id SERIAL PRIMARY KEY,
                event_id VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Table sent_reminder_emails created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
};

createTable();
