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
      END,
      p.duration ASC,
      p.id ASC
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

// Obtener precios por tipo de sesión (puede haber varios)
const getPricingBySessionType = async (sessionTypeName) => {
  const result = await query(`
    SELECT 
      p.*,
      st.name as session_type_name,
      st.display_name as session_type_display_name
    FROM pricing p
    JOIN session_types st ON p.session_type_id = st.id
    WHERE st.name = $1 AND p.is_active = true
    ORDER BY p.duration ASC
  `, [sessionTypeName]);
  return result.rows;
};

// Crear nuevo precio
const createPricing = async (sessionTypeName, price, duration, description) => {
  // Primero obtener el ID del tipo de sesión
  const sessionTypeResult = await query(
    'SELECT id FROM session_types WHERE name = $1',
    [sessionTypeName]
  );

  if (!sessionTypeResult.rows.length) {
    throw new Error(`Session type ${sessionTypeName} not found`);
  }

  const sessionTypeId = sessionTypeResult.rows[0].id;

  // Insert simple (la validación de límites se hace en el controlador)
  const result = await query(`
    INSERT INTO pricing (session_type_id, price, duration, description)
    VALUES ($1, $2, $3, $4)
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
    'UPDATE pricing SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

// Eliminar precio permanentemente (hard delete)
const hardDeletePricing = async (id) => {
  const result = await query(
    'DELETE FROM pricing WHERE id = $1 RETURNING *',
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
  createPricing,
  updatePricing,
  deletePricing,
  hardDeletePricing,
  getAllSessionTypes
};
