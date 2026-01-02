const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createBillingDataTables() {
    try {
        console.log('Creating billing data tables...');

        // Create therapist_billing_data table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS therapist_billing_data (
                id SERIAL PRIMARY KEY,
                therapist_id INTEGER REFERENCES therapists(id) UNIQUE NOT NULL,
                full_name VARCHAR(255),
                nif VARCHAR(20),
                address_line1 VARCHAR(255),
                address_line2 VARCHAR(255),
                city VARCHAR(100),
                postal_code VARCHAR(10),
                iban VARCHAR(34),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ therapist_billing_data table created');

        // Create center_billing_data table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS center_billing_data (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                legal_name VARCHAR(255),
                nif VARCHAR(20),
                address_line1 VARCHAR(255),
                address_line2 VARCHAR(255),
                city VARCHAR(100),
                postal_code VARCHAR(10),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ center_billing_data table created');

        // Insert default center data
        const centerExists = await pool.query('SELECT id FROM center_billing_data LIMIT 1');
        if (centerExists.rows.length === 0) {
            await pool.query(`
                INSERT INTO center_billing_data (name, legal_name, nif, address_line1, city, postal_code)
                VALUES (
                    'Esencialmente Psicología',
                    'Anna Becerra',
                    '47235789E',
                    'C/ del Pintor Togores, 1',
                    'Cerdanyola del Vallès',
                    '08290'
                );
            `);
            console.log('✅ Default center data inserted');
        }

        console.log('✅ All billing data tables created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        process.exit(1);
    }
}

createBillingDataTables();
