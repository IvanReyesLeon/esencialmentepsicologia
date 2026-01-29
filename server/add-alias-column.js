require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        await pool.query("ALTER TABLE therapists ADD COLUMN IF NOT EXISTS calendar_alias VARCHAR(50);");
        console.log("✅ Column calendar_alias added successfully");

        // Update existing aliases based on simple logic (first name)
        // just to initialize data
        /* 
        // Not doing this automatically yet to avoid overriding legacy map logic incorrectly,
        // but 'calendarService' logic handles fallback to full_name/firstname anyway.
        // We will leave it NULL by default and only fill it when user specified.
        */

    } catch (e) {
        console.error("Migration error:", e);
    } finally {
        pool.end();
    }
}

migrate();
