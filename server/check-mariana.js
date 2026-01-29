require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkMarianaCalendarMatching() {
    try {
        // Get Mariana's therapist record
        const therapist = await pool.query(`
            SELECT t.id, t.full_name, t.slug, t.calendar_color_id, u.email, u.id as user_id
            FROM therapists t 
            LEFT JOIN users u ON u.therapist_id = t.id 
            WHERE t.full_name ILIKE '%mariana%';
        `);

        console.log('📊 Datos de Mariana para matching:');
        const m = therapist.rows[0];
        console.log('- Therapist ID:', m.id);
        console.log('- Slug:', m.slug);
        console.log('- calendar_color_id:', m.calendar_color_id);
        console.log('- Email:', m.email);
        console.log('- User ID:', m.user_id);

        // Check if there are synced sessions for Mariana
        const sessions = await pool.query(`
            SELECT COUNT(*) as total, therapist_id, therapist_name
            FROM calendar_sessions 
            WHERE therapist_name ILIKE '%mariana%' OR therapist_id = $1
            GROUP BY therapist_id, therapist_name;
        `, [m.id]);

        console.log('\n📅 Sesiones sincronizadas para Mariana:');
        if (sessions.rows.length === 0) {
            console.log('❌ No hay sesiones asignadas a Mariana (therapist_id=' + m.id + ')');
        } else {
            console.log(sessions.rows);
        }

        // Check all distinct therapist_ids in calendar_sessions
        const allTherapists = await pool.query(`
            SELECT DISTINCT therapist_id, therapist_name, COUNT(*) as count
            FROM calendar_sessions 
            GROUP BY therapist_id, therapist_name
            ORDER BY count DESC;
        `);

        console.log('\n📋 Todos los terapeutas con sesiones sincronizadas:');
        console.log(allTherapists.rows);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        pool.end();
    }
}

checkMarianaCalendarMatching();
