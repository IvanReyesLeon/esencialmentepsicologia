require('dotenv').config({ path: __dirname + '/.env' });
const { pool } = require('./config/db');

async function fixDescription() {
  try {
    await pool.query("UPDATE pricing SET description = 'Sesión de terapia de pareja.' WHERE id = 2");
    console.log('✅ Description fixed for ID 2');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

fixDescription();
