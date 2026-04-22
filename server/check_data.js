require('dotenv').config({ path: __dirname + '/.env' });
const { pool } = require('./config/db');

async function checkData() {
  try {
    const res = await pool.query(`
      SELECT * FROM session_types
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkData();
