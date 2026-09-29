const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../config/db');

const EMDR_NAME = 'Sesión de terapia EMDR';
const EMDR_PRICE = 70;
const EMDR_DURATION = 75;
const EMDR_DESCRIPTION = 'Sesión específica de terapia EMDR para el abordaje de experiencias difíciles y traumáticas. Por sus características, requieren mayor tiempo de sesión y un ritmo de trabajo adaptado a cada persona.';

async function migrate() {
  try {
    console.log('--- Iniciando migración: nombre de tarifas + servicio EMDR ---');

    // 1. Añadir columna "name" a pricing (idempotente)
    console.log('Añadiendo columna pricing.name...');
    await query('ALTER TABLE pricing ADD COLUMN IF NOT EXISTS name VARCHAR(150)');

    // 2. Backfill de tarifas existentes sin nombre.
    //    Si el servicio tiene varias tarifas, se distingue por duración; si tiene solo una, se usa el nombre del servicio tal cual.
    console.log('Rellenando nombres de tarifas existentes...');
    await query(`
      UPDATE pricing p
      SET name = st.display_name || CASE WHEN cnt.total > 1 THEN ' (' || p.duration || ' min)' ELSE '' END
      FROM session_types st,
           (SELECT session_type_id, COUNT(*) AS total FROM pricing GROUP BY session_type_id) cnt
      WHERE p.session_type_id = st.id
        AND p.session_type_id = cnt.session_type_id
        AND p.name IS NULL
    `);

    // 3. Crear el servicio EMDR (si no existe) y su tarifa, de forma idempotente.
    console.log('Creando servicio y tarifa EMDR (si no existen)...');
    const existingType = await query('SELECT id FROM session_types WHERE LOWER(display_name) = LOWER($1)', [EMDR_NAME]);
    let emdrTypeId;
    if (existingType.rows.length) {
      emdrTypeId = existingType.rows[0].id;
    } else {
      const inserted = await query(
        'INSERT INTO session_types (name, display_name) VALUES ($1, $2) RETURNING id',
        ['emdr', EMDR_NAME]
      );
      emdrTypeId = inserted.rows[0].id;
    }

    const existingPricing = await query('SELECT id FROM pricing WHERE session_type_id = $1', [emdrTypeId]);
    if (!existingPricing.rows.length) {
      await query(
        `INSERT INTO pricing (session_type_id, name, price, duration, description, is_active)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [emdrTypeId, EMDR_NAME, EMDR_PRICE, EMDR_DURATION, EMDR_DESCRIPTION]
      );
      console.log('✓ Tarifa EMDR creada.');
    } else {
      console.log('ℹ La tarifa EMDR ya existía, no se duplica.');
    }

    console.log('--- Migración completada con éxito ---');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error durante la migración:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();
