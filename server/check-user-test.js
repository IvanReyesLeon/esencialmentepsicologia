require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkUserTest() {
    try {
        const result = await pool.query(`
            SELECT t.id, t.full_name, t.is_active, u.email 
            FROM therapists t 
            LEFT JOIN users u ON u.therapist_id = t.id 
            WHERE t.full_name ILIKE '%test%' OR t.full_name ILIKE '%user%';
        `);

        if (result.rows.length === 0) {
            console.log('✅ No se encontró ningún terapeuta "user test" - eliminado correctamente');
        } else {
            console.log('❌ Todavía existe:', result.rows);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        pool.end();
    }
}

checkUserTest();
