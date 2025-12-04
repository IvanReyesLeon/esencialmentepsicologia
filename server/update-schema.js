require('dotenv').config();
const { query } = require('./config/db');

const updateSchema = async () => {
    try {
        console.log('Adding methodology and license_number columns to therapists table...');

        await query(`
      ALTER TABLE therapists 
      ADD COLUMN IF NOT EXISTS methodology TEXT,
      ADD COLUMN IF NOT EXISTS license_number TEXT;
    `);

        console.log('Columns added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
};

updateSchema();
