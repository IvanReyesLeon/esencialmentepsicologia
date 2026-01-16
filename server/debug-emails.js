require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkEmails() {
    console.log('\n=== TERAPEUTAS CON EMAIL EN BILLING (RECIBIRÁN RECORDATORIO) ===\n');
    const withEmail = await pool.query(`
    SELECT tbd.full_name, tbd.email, t.full_name as therapist_name
    FROM therapist_billing_data tbd
    JOIN therapists t ON t.id = tbd.therapist_id
    WHERE tbd.email IS NOT NULL AND tbd.email != ''
    ORDER BY tbd.full_name
  `);
    console.table(withEmail.rows);
    console.log(`Total con email: ${withEmail.rows.length}`);

    console.log('\n=== TODOS LOS TERAPEUTAS ===\n');
    const allTherapists = await pool.query(`
    SELECT t.id, t.full_name, t.is_active
    FROM therapists t
    WHERE t.is_active = true
    ORDER BY t.full_name
  `);
    console.table(allTherapists.rows);
    console.log(`Total terapeutas activos: ${allTherapists.rows.length}`);

    console.log('\n=== TERAPEUTAS SIN EMAIL EN BILLING (NO RECIBIRÁN RECORDATORIO) ===\n');
    const withoutEmail = await pool.query(`
    SELECT t.id, t.full_name
    FROM therapists t
    LEFT JOIN therapist_billing_data tbd ON t.id = tbd.therapist_id
    WHERE t.is_active = true
      AND (tbd.email IS NULL OR tbd.email = '' OR tbd.id IS NULL)
    ORDER BY t.full_name
  `);
    console.table(withoutEmail.rows);
    console.log(`Total SIN email (no recibirán recordatorio): ${withoutEmail.rows.length}`);

    pool.end();
}

checkEmails();
