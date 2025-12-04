const { query, getClient } = require('../config/db');

// Función helper para generar slug desde nombre
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
        .replace(/\s+/g, '-') // Espacios a guiones
        .replace(/-+/g, '-') // Múltiples guiones a uno
        .trim();
};

// Obtener todos los terapeutas activos
const getAllTherapists = async () => {
    const result = await query(`
    SELECT 
      t.*,
      COALESCE(json_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '[]') as specializations,
      COALESCE(json_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL), '[]') as languages,
      COALESCE(json_agg(DISTINCT st.display_name) FILTER (WHERE st.display_name IS NOT NULL), '[]') as session_types,
      COALESCE(json_agg(DISTINCT jsonb_build_object('degree', e.degree, 'university', e.university, 'year', e.year)) FILTER (WHERE e.degree IS NOT NULL), '[]') as education
    FROM therapists t
    LEFT JOIN therapist_specializations ts ON t.id = ts.therapist_id
    LEFT JOIN specializations s ON ts.specialization_id = s.id
    LEFT JOIN therapist_languages tl ON t.id = tl.therapist_id
    LEFT JOIN languages l ON tl.language_id = l.id
    LEFT JOIN therapist_session_types tst ON t.id = tst.therapist_id
    LEFT JOIN session_types st ON tst.session_type_id = st.id
    LEFT JOIN education e ON t.id = e.therapist_id
    WHERE t.is_active = true
    GROUP BY t.id
    ORDER BY t.id ASC
  `);
    return result.rows;
};

// Obtener terapeuta por ID
const getTherapistById = async (id) => {
    const result = await query(`
    SELECT 
      t.*,
      COALESCE(json_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '[]') as specializations,
      COALESCE(json_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL), '[]') as languages,
      COALESCE(json_agg(DISTINCT st.display_name) FILTER (WHERE st.display_name IS NOT NULL), '[]') as session_types,
      COALESCE(json_agg(DISTINCT jsonb_build_object('degree', e.degree, 'university', e.university, 'year', e.year)) FILTER (WHERE e.degree IS NOT NULL), '[]') as education
    FROM therapists t
    LEFT JOIN therapist_specializations ts ON t.id = ts.therapist_id
    LEFT JOIN specializations s ON ts.specialization_id = s.id
    LEFT JOIN therapist_languages tl ON t.id = tl.therapist_id
    LEFT JOIN languages l ON tl.language_id = l.id
    LEFT JOIN therapist_session_types tst ON t.id = tst.therapist_id
    LEFT JOIN session_types st ON tst.session_type_id = st.id
    LEFT JOIN education e ON t.id = e.therapist_id
    WHERE t.id = $1
    GROUP BY t.id
  `, [id]);
    return result.rows[0];
};

// Obtener terapeuta por slug
const getTherapistBySlug = async (slug) => {
    const result = await query(`
    SELECT 
      t.*,
      COALESCE(json_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '[]') as specializations,
      COALESCE(json_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL), '[]') as languages,
      COALESCE(json_agg(DISTINCT st.display_name) FILTER (WHERE st.display_name IS NOT NULL), '[]') as session_types,
      COALESCE(json_agg(DISTINCT jsonb_build_object('degree', e.degree, 'university', e.university, 'year', e.year)) FILTER (WHERE e.degree IS NOT NULL), '[]') as education
    FROM therapists t
    LEFT JOIN therapist_specializations ts ON t.id = ts.therapist_id
    LEFT JOIN specializations s ON ts.specialization_id = s.id
    LEFT JOIN therapist_languages tl ON t.id = tl.therapist_id
    LEFT JOIN languages l ON tl.language_id = l.id
    LEFT JOIN therapist_session_types tst ON t.id = tst.therapist_id
    LEFT JOIN session_types st ON tst.session_type_id = st.id
    LEFT JOIN education e ON t.id = e.therapist_id
    WHERE t.slug = $1
    GROUP BY t.id
  `, [slug]);
    return result.rows[0];
};

// Crear terapeuta con relaciones
const createTherapist = async (therapistData) => {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // Generar slug si no viene
        const slug = therapistData.slug || generateSlug(therapistData.full_name);

        // Insertar terapeuta
        const therapistResult = await client.query(`
      INSERT INTO therapists (full_name, bio, experience, photo, slug, meta_title, meta_description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
            therapistData.full_name,
            therapistData.bio,
            therapistData.experience,
            therapistData.photo || '',
            slug,
            therapistData.meta_title || therapistData.full_name,
            therapistData.meta_description || therapistData.bio.substring(0, 280)
        ]);

        const therapist = therapistResult.rows[0];

        // Insertar especialidades
        if (therapistData.specializations && therapistData.specializations.length > 0) {
            for (const spec of therapistData.specializations) {
                const specResult = await client.query(
                    'SELECT id FROM specializations WHERE name = $1',
                    [spec]
                );

                if (specResult.rows.length > 0) {
                    await client.query(
                        'INSERT INTO therapist_specializations (therapist_id, specialization_id) VALUES ($1, $2)',
                        [therapist.id, specResult.rows[0].id]
                    );
                }
            }
        }

        // Insertar idiomas
        if (therapistData.languages && therapistData.languages.length > 0) {
            for (const lang of therapistData.languages) {
                const langResult = await client.query(
                    'SELECT id FROM languages WHERE name = $1',
                    [lang]
                );

                if (langResult.rows.length > 0) {
                    await client.query(
                        'INSERT INTO therapist_languages (therapist_id, language_id) VALUES ($1, $2)',
                        [therapist.id, langResult.rows[0].id]
                    );
                }
            }
        }

        // Insertar tipos de sesión
        if (therapistData.session_types && therapistData.session_types.length > 0) {
            for (const sessionType of therapistData.session_types) {
                const stResult = await client.query(
                    'SELECT id FROM session_types WHERE display_name = $1',
                    [sessionType]
                );

                if (stResult.rows.length > 0) {
                    await client.query(
                        'INSERT INTO therapist_session_types (therapist_id, session_type_id) VALUES ($1, $2)',
                        [therapist.id, stResult.rows[0].id]
                    );
                }
            }
        }

        // Insertar educación
        if (therapistData.education && therapistData.education.length > 0) {
            for (const edu of therapistData.education) {
                await client.query(
                    'INSERT INTO education (therapist_id, degree, university, year) VALUES ($1, $2, $3, $4)',
                    [therapist.id, edu.degree, edu.university, edu.year]
                );
            }
        }

        await client.query('COMMIT');
        return await getTherapistById(therapist.id);

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Actualizar terapeuta
const updateTherapist = async (id, updates) => {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // Actualizar datos básicos del terapeuta
        const fields = [];
        const values = [];
        let paramCount = 1;

        const allowedFields = ['full_name', 'bio', 'experience', 'photo', 'slug', 'meta_title', 'meta_description', 'is_active'];

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
                `UPDATE therapists SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
                values
            );
        }

        // Actualizar especialidades si se proporcionan
        if (updates.specializations) {
            await client.query('DELETE FROM therapist_specializations WHERE therapist_id = $1', [id]);

            for (const spec of updates.specializations) {
                const specResult = await client.query('SELECT id FROM specializations WHERE name = $1', [spec]);
                if (specResult.rows.length > 0) {
                    await client.query(
                        'INSERT INTO therapist_specializations (therapist_id, specialization_id) VALUES ($1, $2)',
                        [id, specResult.rows[0].id]
                    );
                }
            }
        }

        // Actualizar idiomas si se proporcionan
        if (updates.languages) {
            await client.query('DELETE FROM therapist_languages WHERE therapist_id = $1', [id]);

            for (const lang of updates.languages) {
                const langResult = await client.query('SELECT id FROM languages WHERE name = $1', [lang]);
                if (langResult.rows.length > 0) {
                    await client.query(
                        'INSERT INTO therapist_languages (therapist_id, language_id) VALUES ($1, $2)',
                        [id, langResult.rows[0].id]
                    );
                }
            }
        }

        // Actualizar tipos de sesión si se proporcionan
        if (updates.session_types) {
            await client.query('DELETE FROM therapist_session_types WHERE therapist_id = $1', [id]);

            for (const sessionType of updates.session_types) {
                const stResult = await client.query('SELECT id FROM session_types WHERE display_name = $1', [sessionType]);
                if (stResult.rows.length > 0) {
                    await client.query(
                        'INSERT INTO therapist_session_types (therapist_id, session_type_id) VALUES ($1, $2)',
                        [id, stResult.rows[0].id]
                    );
                }
            }
        }

        await client.query('COMMIT');
        return await getTherapistById(id);

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Eliminar terapeuta (soft delete)
const deleteTherapist = async (id) => {
    const result = await query(
        'UPDATE therapists SET is_active = false WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
};

// Obtener todas las especialidades disponibles
const getAllSpecializations = async () => {
    const result = await query('SELECT * FROM specializations ORDER BY name');
    return result.rows;
};

// Obtener todos los idiomas disponibles
const getAllLanguages = async () => {
    const result = await query('SELECT * FROM languages ORDER BY name');
    return result.rows;
};

module.exports = {
    getAllTherapists,
    getTherapistById,
    getTherapistBySlug,
    createTherapist,
    updateTherapist,
    deleteTherapist,
    getAllSpecializations,
    getAllLanguages,
    generateSlug
};
