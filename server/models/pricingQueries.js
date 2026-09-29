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
      st.id ASC,
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

// Crear nuevo precio dentro de un tipo de sesión (servicio) ya existente, por id
const createPricingForType = async (sessionTypeId, name, price, duration, description, isActive) => {
  const result = await query(`
    INSERT INTO pricing (session_type_id, name, price, duration, description, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [sessionTypeId, name, price, duration, description, isActive !== false]);

  return await getPricingById(result.rows[0].id);
};

// Crear nuevo precio a partir del nombre (slug) del tipo de sesión existente
const createPricing = async (sessionTypeName, price, duration, description, name, isActive) => {
  const sessionTypeResult = await query(
    'SELECT id FROM session_types WHERE name = $1',
    [sessionTypeName]
  );

  if (!sessionTypeResult.rows.length) {
    throw new Error(`Session type ${sessionTypeName} not found`);
  }

  return createPricingForType(sessionTypeResult.rows[0].id, name, price, duration, description, isActive);
};

// Generar un slug único (name) para session_types a partir de un texto libre
const slugify = (text) => {
  return (text || '')
    .toString()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'servicio';
};

// Buscar un tipo de sesión (servicio) por nombre visible, o crearlo si no existe.
// Permite crear nuevos servicios/categorías desde ADMIN sin tocar código.
const findOrCreateSessionType = async (displayName) => {
  const trimmed = (displayName || '').trim();
  if (!trimmed) {
    throw new Error('El nombre del servicio no puede estar vacío');
  }

  const existing = await query(
    'SELECT id, name, display_name FROM session_types WHERE LOWER(display_name) = LOWER($1)',
    [trimmed]
  );
  if (existing.rows.length) {
    return existing.rows[0];
  }

  let slug = slugify(trimmed);
  let attempt = 0;
  while (attempt < 5) {
    try {
      const result = await query(
        'INSERT INTO session_types (name, display_name) VALUES ($1, $2) RETURNING id, name, display_name',
        [attempt === 0 ? slug : `${slug}_${attempt}`, trimmed]
      );
      return result.rows[0];
    } catch (error) {
      // 23505 = unique_violation (slug ya existe) -> reintentar con sufijo
      if (error.code === '23505') {
        attempt += 1;
        continue;
      }
      throw error;
    }
  }
  throw new Error(`No se pudo generar un identificador único para el servicio "${trimmed}"`);
};

// Actualizar precio por ID
const updatePricing = async (id, updates) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  const allowedFields = ['name', 'price', 'duration', 'description', 'is_active'];

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
  createPricingForType,
  findOrCreateSessionType,
  updatePricing,
  deletePricing,
  hardDeletePricing,
  getAllSessionTypes
};
