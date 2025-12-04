require('dotenv').config();
const { query } = require('./config/db');

const updateChristian = async () => {
    try {
        console.log('Updating Christian Ayuste data...');

        // Buscar por slug o nombre similar
        const result = await query(`
      UPDATE therapists 
      SET 
        license_number = '29676',
        methodology = 'Mi enfoque es integrador, adaptándome a las necesidades de cada persona. Utilizo herramientas de la Terapia Cognitivo-Conductual, Terapia Sistémica y Mindfulness para acompañarte en tu proceso de cambio y crecimiento personal.'
      WHERE slug = 'christian-ayuste' OR full_name ILIKE '%Christian Ayuste%'
      RETURNING *;
    `);

        if (result.rows.length > 0) {
            console.log('Update successful:', result.rows[0].full_name);
            console.log('License:', result.rows[0].license_number);
            console.log('Methodology:', result.rows[0].methodology);
        } else {
            console.log('Therapist not found!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error updating therapist:', error);
        process.exit(1);
    }
};

updateChristian();
