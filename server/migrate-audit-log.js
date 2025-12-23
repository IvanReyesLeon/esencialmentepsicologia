require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🚀 Creating payment_audit_log table...');
        await client.query('BEGIN');

        // Create audit log table
        await client.query(`
            CREATE TABLE IF NOT EXISTS payment_audit_log (
                id SERIAL PRIMARY KEY,
                session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
                event_id VARCHAR(255),
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                user_name VARCHAR(255),
                therapist_name VARCHAR(255),
                session_date DATE,
                patient_name VARCHAR(255),
                action VARCHAR(50) NOT NULL,
                old_status VARCHAR(50),
                new_status VARCHAR(50),
                payment_date DATE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_audit_user ON payment_audit_log(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_session ON payment_audit_log(session_id);
            CREATE INDEX IF NOT EXISTS idx_audit_created ON payment_audit_log(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_audit_event ON payment_audit_log(event_id);
        `);

        await client.query('COMMIT');
        console.log('✅ payment_audit_log table created successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
