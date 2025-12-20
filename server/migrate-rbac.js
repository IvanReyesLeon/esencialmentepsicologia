require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting RBAC Migration...');
        await client.query('BEGIN');

        // 1. Create ROLES table
        console.log('📋 Creating table roles...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL
            )
        `);

        // Insert default roles
        await client.query(`
            INSERT INTO roles (name) VALUES ('admin'), ('therapist')
            ON CONFLICT (name) DO NOTHING
        `);

        // 2. Modify USERS table
        console.log('📋 Modifying table users...');

        // Add auth-related columns if they don't exist
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id),
            ADD COLUMN IF NOT EXISTS therapist_id INTEGER REFERENCES therapists(id) ON DELETE SET NULL
        `);

        // Assign 'admin' role to existing users who are currently 'admin' (by string column)
        // First get the admin role id
        const adminRoleRes = await client.query("SELECT id FROM roles WHERE name = 'admin'");
        const adminRoleId = adminRoleRes.rows[0].id;

        // Update existing users to have admin role_id
        await client.query(`
            UPDATE users 
            SET role_id = $1 
            WHERE role_id IS NULL AND (role = 'admin' OR role IS NULL)
        `, [adminRoleId]);

        // 3. Modify THERAPISTS table
        console.log('📋 Modifying table therapists...');
        await client.query(`
            ALTER TABLE therapists
            ADD COLUMN IF NOT EXISTS calendar_color_id VARCHAR(50)
        `);

        // 4. Create Session Payments table (for "Paid" status)
        console.log('📋 Creating table session_payments...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS session_payments (
                id SERIAL PRIMARY KEY,
                event_id VARCHAR(255) UNIQUE NOT NULL,
                amount DECIMAL(10, 2),
                status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, paid_cash, paid_bizum
                payment_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await client.query('COMMIT');
        console.log('✅ RBAC Migration completed successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
