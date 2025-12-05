require('dotenv').config();
const { pool } = require('./config/db');

async function migrateContact() {
    const client = await pool.connect();

    try {
        console.log('🚀 Creando tabla contact_messages...');
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                subject VARCHAR(255),
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_contact_unread ON contact_messages(is_read);
        `);

        await client.query('COMMIT');

        console.log('✅ Tabla contact_messages creada correctamente!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrateContact()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
