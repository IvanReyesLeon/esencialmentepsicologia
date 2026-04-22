const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../config/db');

async function migrate() {
  try {
    console.log('--- Iniciando migración de base de datos ---');
    
    // 1. Eliminar la restricción de unicidad
    console.log('Eliminando restricción pricing_session_type_id_key...');
    await query('ALTER TABLE pricing DROP CONSTRAINT IF EXISTS pricing_session_type_id_key');
    
    console.log('✓ Restricción eliminada correctamente.');
    console.log('--- Migración completada con éxito ---');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  }
}

migrate();
