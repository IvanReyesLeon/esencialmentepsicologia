const { query, getClient } = require('../config/db');
const { generateSlug } = require('./therapistQueries');

// Obtener todos los talleres activos
const getAllWorkshops = async (includeInactive = false) => {
    const whereClause = includeInactive ? '' : 'WHERE w.is_active = true';

    const result = await query(`
    SELECT 
      w.*,
      COALESCE(json_agg(
        jsonb_build_object('id', wi.id, 'image_url', wi.image_url, 'is_primary', wi.is_primary)
        ORDER BY wi.is_primary DESC, wi.created_at
      ) FILTER (WHERE wi.id IS NOT NULL), '[]') as images
    FROM workshops w
    LEFT JOIN workshop_images wi ON w.id = wi.workshop_id
    ${whereClause}
    GROUP BY w.id
    ORDER BY w.start_date DESC
  `);

    return result.rows;
};

// Obtener taller por ID
const getWorkshopById = async (id) => {
    const result = await query(`
    SELECT 
      w.*,
      COALESCE(json_agg(
        jsonb_build_object('id', wi.id, 'image_url', wi.image_url, 'is_primary', wi.is_primary)
        ORDER BY wi.is_primary DESC, wi.created_at
      ) FILTER (WHERE wi.id IS NOT NULL), '[]') as images
    FROM workshops w
    LEFT JOIN workshop_images wi ON w.id = wi.workshop_id
    WHERE w.id = $1
    GROUP BY w.id
  `, [id]);

    return result.rows[0];
};

// Obtener taller por slug
const getWorkshopBySlug = async (slug) => {
    const result = await query(`
    SELECT 
      w.*,
      COALESCE(json_agg(
        jsonb_build_object('id', wi.id, 'image_url', wi.image_url, 'is_primary', wi.is_primary)
        ORDER BY wi.is_primary DESC, wi.created_at
      ) FILTER (WHERE wi.id IS NOT NULL), '[]') as images
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
        price, max_participants, location, meta_title, meta_description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
            workshopData.meta_description || workshopData.description.substring(0, 280)
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
            'meta_title', 'meta_description'
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

module.exports = {
    getAllWorkshops,
    getWorkshopById,
    getWorkshopBySlug,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    deleteWorkshopPermanently,
    addWorkshopImage,
    deleteWorkshopImage
};
