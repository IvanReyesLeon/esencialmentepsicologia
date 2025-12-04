require('dotenv').config();
const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');

async function initDatabase() {
    const client = await pool.connect();

    try {
        console.log('🚀 Iniciando creación de base de datos...');

        // Comenzar transacción
        await client.query('BEGIN');

        // 1. Crear tabla de usuarios
        console.log('📋 Creando tabla users...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'therapist')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

        // 2. Crear tabla de terapeutas
        console.log('📋 Creando tabla therapists...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS therapists (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        bio TEXT NOT NULL,
        experience INTEGER NOT NULL,
        photo VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        slug VARCHAR(255) UNIQUE,
        meta_title VARCHAR(150),
        meta_description VARCHAR(300),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

        // 3. Crear tabla de especialidades
        console.log('📋 Creando tabla specializations...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS specializations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      )
    `);

        // 4. Relación terapeutas-especialidades
        await client.query(`
      CREATE TABLE IF NOT EXISTS therapist_specializations (
        therapist_id INTEGER REFERENCES therapists(id) ON DELETE CASCADE,
        specialization_id INTEGER REFERENCES specializations(id) ON DELETE CASCADE,
        PRIMARY KEY (therapist_id, specialization_id)
      )
    `);

        // 5. Crear tabla de idiomas
        console.log('📋 Creando tabla languages...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS languages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      )
    `);

        // 6. Relación terapeutas-idiomas
        await client.query(`
      CREATE TABLE IF NOT EXISTS therapist_languages (
        therapist_id INTEGER REFERENCES therapists(id) ON DELETE CASCADE,
        language_id INTEGER REFERENCES languages(id) ON DELETE CASCADE,
        PRIMARY KEY (therapist_id, language_id)
      )
    `);

        // 7. Crear tabla de educación
        console.log('📋 Creando tabla education...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS education (
        id SERIAL PRIMARY KEY,
        therapist_id INTEGER REFERENCES therapists(id) ON DELETE CASCADE,
        degree VARCHAR(255) NOT NULL,
        university VARCHAR(255),
        year INTEGER
      )
    `);

        // 8. Crear tabla de tipos de sesión
        console.log('📋 Creando tabla session_types...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS session_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL
      )
    `);

        // 9. Relación terapeutas-tipos de sesión
        await client.query(`
      CREATE TABLE IF NOT EXISTS therapist_session_types (
        therapist_id INTEGER REFERENCES therapists(id) ON DELETE CASCADE,
        session_type_id INTEGER REFERENCES session_types(id) ON DELETE CASCADE,
        PRIMARY KEY (therapist_id, session_type_id)
      )
    `);

        // 10. Crear tabla de precios
        console.log('📋 Creando tabla pricing...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS pricing (
        id SERIAL PRIMARY KEY,
        session_type_id INTEGER REFERENCES session_types(id) UNIQUE,
        price DECIMAL(10, 2) NOT NULL,
        duration INTEGER NOT NULL,
        description TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

        // 11. Crear tabla de mensajes de contacto
        console.log('📋 Creando tabla contact_messages...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(500),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

        // 12. Crear tabla de talleres
        console.log('📋 Creando tabla workshops...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS workshops (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        slug VARCHAR(255) UNIQUE,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        price DECIMAL(10, 2) NOT NULL,
        max_participants INTEGER,
        location VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        meta_title VARCHAR(150),
        meta_description VARCHAR(300),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

        // 13. Crear tabla de imágenes de talleres
        console.log('📋 Creando tabla workshop_images...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS workshop_images (
        id SERIAL PRIMARY KEY,
        workshop_id INTEGER REFERENCES workshops(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

        // 14. Crear índices
        console.log('🔍 Creando índices...');
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_therapists_slug ON therapists(slug);
      CREATE INDEX IF NOT EXISTS idx_therapists_active ON therapists(is_active);
      CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_contact_read ON contact_messages(is_read);
      CREATE INDEX IF NOT EXISTS idx_workshops_slug ON workshops(slug);
      CREATE INDEX IF NOT EXISTS idx_workshops_active ON workshops(is_active);
      CREATE INDEX IF NOT EXISTS idx_workshops_dates ON workshops(start_date DESC);
    `);

        // 15. Insertar datos iniciales - Tipos de sesión
        console.log('📝 Insertando tipos de sesión...');
        await client.query(`
      INSERT INTO session_types (name, display_name) VALUES
        ('individual', 'Individual'),
        ('couple', 'Pareja'),
        ('family', 'Familiar'),
        ('group', 'Grupal')
      ON CONFLICT (name) DO NOTHING
    `);

        // 16. Insertar idiomas comunes
        console.log('📝 Insertando idiomas...');
        await client.query(`
      INSERT INTO languages (name) VALUES
        ('Español'),
        ('Catalán'),
        ('Inglés'),
        ('Francés'),
        ('Alemán'),
        ('Italiano')
      ON CONFLICT (name) DO NOTHING
    `);

        // 17. Insertar especialidades comunes
        console.log('📝 Insertando especialidades...');
        await client.query(`
      INSERT INTO specializations (name) VALUES
        ('Psicología Sanitaria'),
        ('Psicoterapeuta Integradora'),
        ('EMDR'),
        ('Terapia de Pareja'),
        ('Terapia Familiar'),
        ('Ansiedad y Estrés'),
        ('Depresión'),
        ('Trauma'),
        ('Terapia Infantil'),
        ('Terapia para Adolescentes')
      ON CONFLICT (name) DO NOTHING
    `);

        // 18. Crear usuario administrador por defecto
        console.log('👤 Creando usuario administrador...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await client.query(`
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['admin', 'admin@esencialmentepsicologia.com', hashedPassword, 'admin']);

        // 19. Insertar precios por defecto
        console.log('💰 Insertando precios por defecto...');
        const sessionTypes = await client.query('SELECT id, name FROM session_types');
        for (const sessionType of sessionTypes.rows) {
            let price, duration, description;

            switch (sessionType.name) {
                case 'individual':
                    price = 60;
                    duration = 60;
                    description = 'Sesión individual de terapia psicológica';
                    break;
                case 'couple':
                    price = 75;
                    duration = 75;
                    description = 'Sesión de terapia de pareja';
                    break;
                case 'family':
                    price = 80;
                    duration = 75;
                    description = 'Sesión de terapia familiar';
                    break;
                case 'group':
                    price = 40;
                    duration = 90;
                    description = 'Sesión de terapia grupal';
                    break;
            }

            await client.query(`
        INSERT INTO pricing (session_type_id, price, duration, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (session_type_id) DO NOTHING
      `, [sessionType.id, price, duration, description]);
        }

        // Commit transacción
        await client.query('COMMIT');

        console.log('✅ Base de datos inicializada correctamente!');
        console.log('');
        console.log('📌 Usuario administrador creado:');
        console.log('   Email: admin@esencialmentepsicologia.com');
        console.log('   Contraseña: admin123');
        console.log('');
        console.log('⚠️  IMPORTANTE: Cambia esta contraseña en producción!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error al inicializar la base de datos:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar
initDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
