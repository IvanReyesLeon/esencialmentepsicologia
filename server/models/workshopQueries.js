const { query, getClient } = require('../config/db');
const { generateSlug } = require('./therapistQueries');

// Obtener todos los talleres activos (con conteo de inscritos)
const getAllWorkshops = async (includeInactive = false) => {
    const whereClause = includeInactive ? '' : 'WHERE w.is_active = true';

    const result = await query(`
    SELECT 
      w.*,
      COALESCE(json_agg(
        jsonb_build_object('id', wi.id, 'image_url', wi.image_url, 'is_primary', wi.is_primary)
        ORDER BY wi.is_primary DESC, wi.created_at
      ) FILTER (WHERE wi.id IS NOT NULL), '[]') as images,
      (SELECT COUNT(*) FROM workshop_registrations wr WHERE wr.workshop_id = w.id AND wr.status != 'cancelled') as registration_count
    FROM workshops w
    LEFT JOIN workshop_images wi ON w.id = wi.workshop_id
    ${whereClause}
    GROUP BY w.id
    ORDER BY w.start_date DESC
  `);

    return result.rows;
};

// Obtener taller por ID (con conteo de inscritos)
const getWorkshopById = async (id) => {
    const result = await query(`
    SELECT 
      w.*,
      COALESCE(json_agg(
        jsonb_build_object('id', wi.id, 'image_url', wi.image_url, 'is_primary', wi.is_primary)
        ORDER BY wi.is_primary DESC, wi.created_at
      ) FILTER (WHERE wi.id IS NOT NULL), '[]') as images,
      (SELECT COUNT(*) FROM workshop_registrations wr WHERE wr.workshop_id = w.id AND wr.status != 'cancelled') as registration_count
    FROM workshops w
    LEFT JOIN workshop_images wi ON w.id = wi.workshop_id
    WHERE w.id = $1
    GROUP BY w.id
  `, [id]);

    return result.rows[0];
};

// Obtener taller por slug (con conteo de inscritos)
const getWorkshopBySlug = async (slug) => {
    const result = await query(`
    SELECT 
      w.*,
      COALESCE(json_agg(
        jsonb_build_object('id', wi.id, 'image_url', wi.image_url, 'is_primary', wi.is_primary)
        ORDER BY wi.is_primary DESC, wi.created_at
      ) FILTER (WHERE wi.id IS NOT NULL), '[]') as images,
      (SELECT COUNT(*) FROM workshop_registrations wr WHERE wr.workshop_id = w.id AND wr.status != 'cancelled') as registration_count
    FROM workshops w
    LEFT JOIN workshop_images wi ON w.id = wi.workshop_id
    WHERE w.slug = $1
    GROUP BY w.id
  `, [slug]);

    return result.rows[0];
};

// Crear taller
const createWorkshop = async (workshopData) => {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // Generar slug si no viene
        const slug = workshopData.slug || generateSlug(workshopData.title);

        // Insertar taller
        const workshopResult = await client.query(`
      INSERT INTO workshops (
        title, description, slug, start_date, end_date, 
        price, max_participants, location, meta_title, meta_description,
        allow_registration, show_attendees_count, is_clickable, manual_attendees
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
            workshopData.title,
            workshopData.description,
            slug,
            workshopData.start_date,
            workshopData.end_date || null,
            workshopData.price,
            workshopData.max_participants || null,
            workshopData.location || null,
            workshopData.meta_title || workshopData.title,
            workshopData.meta_description || workshopData.description.substring(0, 280),
            workshopData.allow_registration !== false,
            workshopData.show_attendees_count || false,
            workshopData.is_clickable !== false,
            workshopData.manual_attendees || 0
        ]);

        const workshop = workshopResult.rows[0];

        // Insertar imágenes si se proporcionan
        if (workshopData.images && workshopData.images.length > 0) {
            for (let i = 0; i < workshopData.images.length; i++) {
                const img = workshopData.images[i];
                await client.query(
                    'INSERT INTO workshop_images (workshop_id, image_url, is_primary) VALUES ($1, $2, $3)',
                    [workshop.id, img, i === 0] // Primera imagen es la principal
                );
            }
        }

        await client.query('COMMIT');
        return await getWorkshopById(workshop.id);

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Actualizar taller
const updateWorkshop = async (id, updates) => {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // Actualizar datos básicos del taller
        const fields = [];
        const values = [];
        let paramCount = 1;

        const allowedFields = [
            'title', 'description', 'slug', 'start_date', 'end_date',
            'price', 'max_participants', 'location', 'is_active',
            'meta_title', 'meta_description',
            'allow_registration', 'show_attendees_count', 'is_clickable', 'manual_attendees'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                fields.push(`${field} = $${paramCount}`);
                values.push(updates[field]);
                paramCount++;
            }
        });

        if (fields.length > 0) {
            values.push(id);
            await client.query(
                `UPDATE workshops SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
                values
            );
        }

        // Actualizar imágenes si se proporcionan
        if (updates.images) {
            // Eliminar imágenes existentes
            await client.query('DELETE FROM workshop_images WHERE workshop_id = $1', [id]);

            // Insertar nuevas imágenes
            for (let i = 0; i < updates.images.length; i++) {
                const img = updates.images[i];
                await client.query(
                    'INSERT INTO workshop_images (workshop_id, image_url, is_primary) VALUES ($1, $2, $3)',
                    [id, img, i === 0]
                );
            }
        }

        await client.query('COMMIT');
        return await getWorkshopById(id);

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Eliminar taller (soft delete)
const deleteWorkshop = async (id) => {
    const result = await query(
        'UPDATE workshops SET is_active = false WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
};

// Eliminar taller permanentemente
const deleteWorkshopPermanently = async (id) => {
    const result = await query(
        'DELETE FROM workshops WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
};

// Añadir imagen a taller
const addWorkshopImage = async (workshopId, imageUrl, isPrimary = false) => {
    // Si es imagen principal, quitar flag de las demás
    if (isPrimary) {
        await query(
            'UPDATE workshop_images SET is_primary = false WHERE workshop_id = $1',
            [workshopId]
        );
    }

    const result = await query(
        'INSERT INTO workshop_images (workshop_id, image_url, is_primary) VALUES ($1, $2, $3) RETURNING *',
        [workshopId, imageUrl, isPrimary]
    );

    return result.rows[0];
};

// Eliminar imagen de taller
const deleteWorkshopImage = async (imageId) => {
    const result = await query(
        'DELETE FROM workshop_images WHERE id = $1 RETURNING *',
        [imageId]
    );
    return result.rows[0];
};

// ==================== INSCRIPCIONES ====================

// Obtener inscripciones de un taller
const getWorkshopRegistrations = async (workshopId) => {
    const result = await query(`
        SELECT * FROM workshop_registrations 
        WHERE workshop_id = $1 
        ORDER BY created_at DESC
    `, [workshopId]);
    return result.rows;
};

// Registrar inscripción (pública)
const registerToWorkshop = async (workshopId, registrationData) => {
    // Verificar si el taller existe y permite inscripciones
    const workshop = await getWorkshopById(workshopId);
    if (!workshop) {
        throw new Error('Taller no encontrado');
    }
    if (!workshop.allow_registration) {
        throw new Error('Las inscripciones están cerradas para este taller');
    }
    if (!workshop.is_active) {
        throw new Error('Este taller no está activo');
    }

    // Verificar plazas disponibles
    if (workshop.max_participants) {
        const totalAttendees = parseInt(workshop.registration_count) + (workshop.manual_attendees || 0);
        if (totalAttendees >= workshop.max_participants) {
            throw new Error('No quedan plazas disponibles');
        }
    }

    // Verificar si el email ya está registrado para este taller
    const existing = await query(
        'SELECT id FROM workshop_registrations WHERE workshop_id = $1 AND email = $2 AND status != $3',
        [workshopId, registrationData.email, 'cancelled']
    );
    if (existing.rows.length > 0) {
        throw new Error('Ya estás inscrito en este taller');
    }

    const result = await query(`
        INSERT INTO workshop_registrations (workshop_id, name, email, phone, notes, is_manual, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `, [
        workshopId,
        registrationData.name,
        registrationData.email,
        registrationData.phone || null,
        registrationData.notes || null,
        false,
        'confirmed'
    ]);

    return result.rows[0];
};

// Añadir inscripción manual (admin)
const addManualRegistration = async (workshopId, registrationData) => {
    const result = await query(`
        INSERT INTO workshop_registrations (workshop_id, name, email, phone, notes, is_manual, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `, [
        workshopId,
        registrationData.name,
        registrationData.email || '',
        registrationData.phone || null,
        registrationData.notes || null,
        true,
        'confirmed'
    ]);

    return result.rows[0];
};

// Actualizar estado de inscripción
const updateRegistrationStatus = async (registrationId, status) => {
    const result = await query(`
        UPDATE workshop_registrations 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING *
    `, [status, registrationId]);
    return result.rows[0];
};

// Eliminar inscripción
const deleteRegistration = async (registrationId) => {
    const result = await query(
        'DELETE FROM workshop_registrations WHERE id = $1 RETURNING *',
        [registrationId]
    );
    return result.rows[0];
};

// Obtener estadísticas de inscripciones de un taller
const getWorkshopStats = async (workshopId) => {
    const result = await query(`
        SELECT 
            COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
            COUNT(*) FILTER (WHERE is_manual = true AND status != 'cancelled') as manual,
            COUNT(*) FILTER (WHERE is_manual = false AND status != 'cancelled') as online
        FROM workshop_registrations
        WHERE workshop_id = $1
    `, [workshopId]);
    return result.rows[0];
};

module.exports = {
    getAllWorkshops,
    getWorkshopById,
    getWorkshopBySlug,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    deleteWorkshopPermanently,
    addWorkshopImage,
    deleteWorkshopImage,
    // Inscripciones
    getWorkshopRegistrations,
    registerToWorkshop,
    addManualRegistration,
    updateRegistrationStatus,
    deleteRegistration,
    getWorkshopStats
};
