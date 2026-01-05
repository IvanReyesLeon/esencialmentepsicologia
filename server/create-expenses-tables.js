require('dotenv').config({ path: 'server/.env' }); // Adjust path if running from root
const pool = require('./config/db');

const createExpensesTables = async () => {
    try {
        console.log('Creating expenses tables...');

        // 1. Table for individual monthly expenses
        await pool.query(`
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                category VARCHAR(50) NOT NULL,
                description TEXT,
                amount NUMERIC(10, 2) NOT NULL,
                provider VARCHAR(255),
                document_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Table "expenses" created/verified.');

        // 2. Table for recurring expense templates
        await pool.query(`
            CREATE TABLE IF NOT EXISTS recurring_expenses (
                id SERIAL PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                description TEXT,
                amount NUMERIC(10, 2) NOT NULL,
                provider VARCHAR(255),
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Table "recurring_expenses" created/verified.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        process.exit(1);
    }
};

createExpensesTables();
