require('dotenv').config();
const { pool } = require('./config/db');

const MARIANA_UPDATES = {
    full_name: 'Mariana Souto',
    slug: 'mariana-souto', // Updating slug to match full name
    bio: `Vengo de una familia de mujeres donde la psicología, la educación y la enseñanza siempre estuvieron sentadas en la mesa. Psicólogas, educadoras, maestras. Crecí escuchando historias, preguntas y reflexiones sobre el comportamiento humano, sobre lo que nos duele, lo que nos mueve y lo que nos transforma. Desde muy temprano entendí, que el bienestar mental lo cambia todo.\n\nNací en Uruguay, un país donde la salud mental ocupa un lugar central: se habla, se nombra, se cuida. Donde se entiende que mirar hacia adentro hace la diferencia. Con una fuerte raíz psicoanalítica, donde el inconsciente tiene un papel protagónico. Allí es donde aprendí que comprendernos es un acto profundo de responsabilidad y amor.\n\nDurante mi adolescencia emigré. Atravesé cambios profundos y procesos de adaptación que me pusieron a prueba. En ese movimiento, que a veces desordena y sacude, algo se fue acomodando con claridad: el deseo genuino de ayudar, acompañar y comprender a quienes transitan momentos que los desestabilizan. Porque el movimiento nos confronta, nos desequilibra, y la salud mental puede convertirse en ese flotador que aparece en medio del mar. Un sostén. Un espacio donde tomar aire. Una posibilidad real de no hundirse. Porque sí: ahí es donde aprendemos a salvarnos.\n\nMi etapa universitaria fue, en sí misma, un viaje. Estudié en Barcelona, Málaga, Uruguay e Italia. Los intercambios me regalaron experiencias, vivencias y, sobre todo, perspectiva. Mucha perspectiva. Cada encuentro, cada cultura y cada historia profundizaron mi amor por el comportamiento humano y por la magia de sus múltiples y diversas expresiones.\n\nHoy todo tiene sentido. Cada esfuerzo, cada vivencia y cada cambio me trajeron hasta aquí, a un lugar donde encuentro coherencia y plenitud. Para acompañar a otras personas en sus procesos, a habitar, dar sentido y presencia. Para vivir más leve, casi como si se tratase de una caricia al alma.`,
    methodology: `Mi forma de trabajar parte de algo esencial: que te sientas escuchada/o. Creo en el encuentro terapéutico como una danza, un espacio vivo donde, poco a poco, pueden emerger aquellas cosas que incomodan, que pesan o que no encuentran palabras.\n\nEn un ambiente seguro, de cuidado y respeto, trabajamos para entender, dar sentido y construir una historia que abrace. Una historia que no juzgue, sino que contenga.\n\nIntegro diferentes enfoques y técnicas según cada proceso: trabajo con trauma, apego, ansiedad, depresión y problemáticas vinculares, incorporando técnicas restaurativas y una mirada profunda desde la escucha y la interpretación. Juntas/os le damos una vuelta a aquello que hoy te duele o incomoda, para mirarlo desde otro lugar. La terapia es un espacio para resignificar, para reparar, para encontrarte.\n\n¿Te animás a empezar este camino?`,
    photo: '/uploads/terapeutas/mariana_souto.png'
};

const updateMarianaPublic = async () => {
    const client = await pool.connect();

    try {
        console.log('📝 Actualizando perfil público de Mariana...');
        await client.query('BEGIN');

        // Buscar a Mariana por el slug anterior ("mariana") o por ID si sabemos cuál es (ID 12 según logs anteriores)
        // Usaremos ILIKE 'Mariana%' para ser seguros

        const result = await client.query(
            `UPDATE therapists 
             SET full_name = $1, 
                 slug = $2, 
                 bio = $3, 
                 methodology = $4, 
                 photo = $5,
                 updated_at = NOW()
             WHERE full_name ILIKE 'Mariana%' 
             RETURNING id, full_name, slug`,
            [
                MARIANA_UPDATES.full_name,
                MARIANA_UPDATES.slug,
                MARIANA_UPDATES.bio,
                MARIANA_UPDATES.methodology,
                MARIANA_UPDATES.photo
            ]
        );

        if (result.rowCount > 0) {
            console.log(`✅ Perfil actualizado: ${result.rows[0].full_name} (ID: ${result.rows[0].id})`);

            // También actualizamos el username para que coincida? (Opcional, pero limpio)
            // No, el usuario 'mariana' está bien. No lo tocaremos.

        } else {
            console.log('⚠️ No se encontró el terapeuta "Mariana" para actualizar.');
        }

        await client.query('COMMIT');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error actualizando perfil:', error);
    } finally {
        client.release();
        pool.end();
    }
};

updateMarianaPublic();
