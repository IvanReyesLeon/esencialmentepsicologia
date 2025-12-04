const { query } = require('../config/db');

// Obtener todos los precios con información del tipo de sesión
const getAllPricing = async () => {
  const result = await query(`
    SELECT 
      p.*,
      st.name as session_type_name,
      st.display_name as session_type_display_name
    FROM pricing p
    JOIN session_types st ON p.session_type_id = st.id
    ORDER BY 
      CASE st.name
        WHEN 'individual' THEN 1
        WHEN 'couple' THEN 2
        WHEN 'family' THEN 3
        WHEN 'group' THEN 4
      END
  `);
  return result.rows;
};

// Obtener precio por ID
const getPricingById = async (id) => {
  const result = await query(`
    SELECT 
      p.*,
      st.name as session_type_name,
      st.display_name as session_type_display_name
    FROM pricing p
    JOIN session_types st ON p.session_type_id = st.id
    WHERE p.id = $1
  `, [id]);
  return result.rows[0];
};

// Obtener precio por tipo de sesión
const getPricingBySessionType = async (sessionTypeName) => {
  const result = await query(`
    SELECT 
      p.*,
      st.name as session_type_name,
      st.display_name as session_type_display_name
    FROM pricing p
    JOIN session_types st ON p.session_type_id = st.id
    WHERE st.name = $1
  `, [sessionTypeName]);
  return result.rows[0];
};

// Crear o actualizar precio (upsert)
const upsertPricing = async (sessionTypeName, price, duration, description) => {
  // Primero obtener el ID del tipo de sesión
  const sessionTypeResult = await query(
    'SELECT id FROM session_types WHERE name = $1',
    [sessionTypeName]
  );

  if (!sessionTypeResult.rows.length) {
    throw new Error(`Session type ${sessionTypeName} not found`);
  }

  const sessionTypeId = sessionTypeResult.rows[0].id;

  // Upsert (insert o update si ya existe)
  const result = await query(`
    INSERT INTO pricing (session_type_id, price, duration, description)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (session_type_id)
    DO UPDATE SET 
      price = EXCLUDED.price,
      duration = EXCLUDED.duration,
      description = EXCLUDED.description,
      updated_at = NOW()
    RETURNING *
  `, [sessionTypeId, price, duration, description]);

  return await getPricingById(result.rows[0].id);
};

// Actualizar precio por ID
const updatePricing = async (id, updates) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  const allowedFields = ['price', 'duration', 'description', 'is_active'];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      fields.push(`${field} = $${paramCount}`);
      values.push(updates[field]);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  await query(
    `UPDATE pricing SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
    values
  );

  return await getPricingById(id);
};

// Eliminar precio (soft delete)
const deletePricing = async (id) => {
  const result = await query(
    'UPDATE pricing SET is_active = false WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

// Obtener todos los tipos de sesión
const getAllSessionTypes = async () => {
  const result = await query('SELECT * FROM session_types ORDER BY id');
  return result.rows;
};

module.exports = {
  getAllPricing,
  getPricingById,
  getPricingBySessionType,
  upsertPricing,
  updatePricing,
  deletePricing,
  getAllSessionTypes
};
