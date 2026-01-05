require('dotenv').config({ path: 'server/.env' });
const pool = require('./config/db');

const createNotificationsTable = async () => {
    try {
        console.log('Creating notifications table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('✅ Table "notifications" created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
};

createNotificationsTable();
