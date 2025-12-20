require('dotenv').config();
const { pool } = require('./config/db');

async function createPostsTable() {
    try {
        console.log('Creando tabla posts...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                content TEXT,
                image_url TEXT,
                excerpt TEXT,
                meta_title TEXT,
                meta_description TEXT,
                published BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Tabla posts creada correctamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creando tabla posts:', error);
        process.exit(1);
    }
}

createPostsTable();
