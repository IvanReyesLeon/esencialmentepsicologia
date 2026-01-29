require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

(async () => {
    const hash = await bcrypt.hash('ivan123', 10);
    await pool.query(
        `INSERT INTO users (username, email, password, role, is_active) 
         VALUES ('ivan', 'ivan@esencialmentepsicologia.com', $1, 'admin', true) 
         ON CONFLICT (email) DO UPDATE SET password = $1`,
        [hash]
    );
    console.log('✅ Usuario admin creado: ivan@esencialmentepsicologia.com / ivan123');
    pool.end();
})();
