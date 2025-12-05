require('dotenv').config();
const { pool } = require('./config/db');

async function migrateWorkshops() {
    const client = await pool.connect();

    try {
        console.log('🚀 Iniciando migración de talleres...');
        await client.query('BEGIN');

        // 1. Añadir nuevos campos a workshops
        console.log('📋 Añadiendo nuevos campos a workshops...');

        // allow_registration - permite inscripciones online
        await client.query(`
            ALTER TABLE workshops 
            ADD COLUMN IF NOT EXISTS allow_registration BOOLEAN DEFAULT true
        `);

        // show_attendees_count - mostrar contador de inscritos en público
        await client.query(`
            ALTER TABLE workshops 
            ADD COLUMN IF NOT EXISTS show_attendees_count BOOLEAN DEFAULT false
        `);

        // is_clickable - si se puede hacer click para ver detalles (diferente de is_active)
        await client.query(`
            ALTER TABLE workshops 
            ADD COLUMN IF NOT EXISTS is_clickable BOOLEAN DEFAULT true
        `);

        // manual_attendees - inscripciones manuales (presenciales)
        await client.query(`
            ALTER TABLE workshops 
            ADD COLUMN IF NOT EXISTS manual_attendees INTEGER DEFAULT 0
        `);

        // 2. Crear tabla de inscripciones
        console.log('📋 Creando tabla workshop_registrations...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS workshop_registrations (
                id SERIAL PRIMARY KEY,
                workshop_id INTEGER REFERENCES workshops(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                notes TEXT,
                is_manual BOOLEAN DEFAULT false,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // 3. Crear índices para la tabla de inscripciones
        console.log('🔍 Creando índices...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_registrations_workshop ON workshop_registrations(workshop_id);
            CREATE INDEX IF NOT EXISTS idx_registrations_email ON workshop_registrations(email);
            CREATE INDEX IF NOT EXISTS idx_registrations_status ON workshop_registrations(status);
            CREATE INDEX IF NOT EXISTS idx_registrations_created ON workshop_registrations(created_at DESC);
        `);

        await client.query('COMMIT');

        console.log('✅ Migración completada correctamente!');
        console.log('');
        console.log('📌 Nuevos campos añadidos a workshops:');
        console.log('   - allow_registration: Habilita/deshabilita inscripciones online');
        console.log('   - show_attendees_count: Muestra contador de inscritos en público');
        console.log('   - is_clickable: Si el taller es clickeable para ver detalles');
        console.log('   - manual_attendees: Número de inscripciones presenciales');
        console.log('');
        console.log('📌 Nueva tabla: workshop_registrations');
        console.log('   Almacena las inscripciones online de los talleres');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en la migración:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrateWorkshops()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
