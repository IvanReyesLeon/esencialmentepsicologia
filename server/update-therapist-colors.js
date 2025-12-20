require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE || process.env.DATABASE_URL,
    ssl: (process.env.DATABASE || process.env.DATABASE_URL)?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

// Actualizar los que faltaron por diferencias en nombres
const updates = [
    { name: 'Mónica', color_id: 8 },    // Grafito (gris)
    { name: 'Lucía', color_id: 2 },     // Salvia (verde claro)
    { name: 'Cèlia', color_id: 3 },     // Uva (morado)
    // Eli y Patri no están en la base de datos actualmente
];

async function updateMissing() {
    const client = await pool.connect();

    try {
        console.log('🎨 Actualizando terapeutas faltantes...\n');

        for (const therapist of updates) {
            const result = await client.query(
                `UPDATE therapists 
                 SET calendar_color_id = $1 
                 WHERE full_name ILIKE $2
                 RETURNING id, full_name, calendar_color_id`,
                [therapist.color_id, `%${therapist.name}%`]
            );

            if (result.rowCount > 0) {
                console.log(`✅ ${result.rows[0].full_name} → Color ID: ${therapist.color_id}`);
            } else {
                console.log(`⚠️  No se encontró: "${therapist.name}"`);
            }
        }

        // Mostrar estado final
        const allTherapists = await client.query(
            'SELECT id, full_name, calendar_color_id FROM therapists ORDER BY full_name'
        );

        console.log('\n📋 Estado final:');
        console.table(allTherapists.rows);

    } finally {
        client.release();
        pool.end();
    }
}

updateMissing();
