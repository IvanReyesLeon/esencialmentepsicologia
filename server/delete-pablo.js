require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function deletePablo() {
    try {
        // Check if Pablo exists
        const check = await pool.query("SELECT id, full_name FROM therapists WHERE full_name ILIKE '%pablo%'");
        console.log('Pablo encontrado:', check.rows);

        if (check.rows.length > 0) {
            const id = check.rows[0].id;

            // Delete related records first
            await pool.query('DELETE FROM therapist_billing_data WHERE therapist_id = $1', [id]);
            await pool.query('DELETE FROM therapist_specializations WHERE therapist_id = $1', [id]);
            await pool.query('DELETE FROM therapist_languages WHERE therapist_id = $1', [id]);
            await pool.query('DELETE FROM therapist_session_types WHERE therapist_id = $1', [id]);
            await pool.query('DELETE FROM education WHERE therapist_id = $1', [id]);
            await pool.query('DELETE FROM users WHERE therapist_id = $1', [id]);

            // Delete therapist
            const result = await pool.query('DELETE FROM therapists WHERE id = $1 RETURNING *', [id]);
            console.log('PABLO ELIMINADO:', result.rows[0]);
        } else {
            console.log('Pablo ya no existe en la BD');
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

deletePablo();
