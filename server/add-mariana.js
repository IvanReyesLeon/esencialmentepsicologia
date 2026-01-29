require('dotenv').config();
const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');

const MARIANA = {
    full_name: 'Mariana', // Placeholder last name can be updated later
    label: 'Psicóloga', // Basic label
    bio: 'Perfil pendiente de completar.',
    methodology: 'Pendiente de añadir.',
    specializations: [],
    experience: 0,
    languages: ['Español'],
    session_types: [],
    photo: '',
    calendar_color_id: 4, // Pink
    slug: 'mariana',
    license_number: ''
};

const USER = {
    username: 'mariana',
    email: 'mariana@esencialmentepsicologia.com',
    password: 'mariana123',
    role: 'therapist'
};

const addMariana = async () => {
    const client = await pool.connect();

    try {
        console.log('🚀 Iniciando proceso para añadir a Mariana...');
        await client.query('BEGIN');

        // 1. Crear Terapeuta
        console.log('1. Creando perfil de terapeuta...');

        // Verificar si existe por slug
        const checkSlug = await client.query('SELECT id FROM therapists WHERE slug = $1', [MARIANA.slug]);
        if (checkSlug.rows.length > 0) {
            console.log('⚠️ Ya existe un terapeuta con slug "mariana". Abortando para evitar duplicados.');
            // Podríamos optar por actualizar, pero mejor abortar para seguridad
            // throw new Error('Therapist already exists');
        }

        const therapistQuery = `
            INSERT INTO therapists (
                full_name, bio, experience, photo, slug, meta_title, 
                meta_description, methodology, license_number, label, 
                calendar_color_id, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
            RETURNING *
        `;

        const therapistValues = [
            MARIANA.full_name,
            MARIANA.bio,
            MARIANA.experience,
            MARIANA.photo,
            MARIANA.slug,
            MARIANA.full_name,
            MARIANA.bio, // Meta description placeholder
            MARIANA.methodology,
            MARIANA.license_number,
            MARIANA.label,
            MARIANA.calendar_color_id
        ];

        let therapistId;

        if (checkSlug.rows.length > 0) {
            therapistId = checkSlug.rows[0].id;
            console.log(`ℹ️ Usando terapeuta existente ID: ${therapistId}`);
        } else {
            const therapistResult = await client.query(therapistQuery, therapistValues);
            therapistId = therapistResult.rows[0].id;
            console.log(`✅ Terapeuta creado con éxito. ID: ${therapistId} (${therapistResult.rows[0].full_name})`);
        }

        // 2. Crear Usuario
        console.log('2. Creando usuario de acceso...');

        // Verificar si usuario ya existe
        const checkUser = await client.query('SELECT id FROM users WHERE email = $1', [USER.email]);
        if (checkUser.rows.length > 0) {
            console.log('⚠️ El usuario con email mariana@esencialmentepsicologia.com ya existe.');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(USER.password, salt);

            const userQuery = `
                INSERT INTO users (username, email, password, role, is_active, therapist_id)
                VALUES ($1, $2, $3, $4, true, $5)
                RETURNING id, username
            `;

            const userResult = await client.query(userQuery, [
                USER.username,
                USER.email,
                hashedPassword,
                USER.role,
                therapistId
            ]);

            console.log(`✅ Usuario creado con éxito: ${userResult.rows[0].username}`);
        }

        await client.query('COMMIT');
        console.log('🎉 Proceso completado correctamente.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en el proceso:', error);
    } finally {
        client.release();
        pool.end();
    }
};

addMariana();
