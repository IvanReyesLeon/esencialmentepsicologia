require('dotenv').config();
const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');

const THERAPISTS = [
    { name: 'sara', id: 8, fullName: 'Sara Ochoa' },
    { name: 'miriam', id: 5, fullName: 'Miriam Expósito' },
    { name: 'elisabet', id: 11, fullName: 'Elisabet Vidal' },
    { name: 'monica', id: 7, fullName: 'Mónica Vidal' },
    { name: 'lucia', id: 2, fullName: 'Lucía Gómez' },
    { name: 'yaiza', id: 4, fullName: 'Yaiza González' },
    { name: 'sonia', id: 6, fullName: 'Sonia Montesinos' },
    { name: 'anna', id: 1, fullName: 'Anna Becerra' },
    { name: 'christian', id: 3, fullName: 'Christian Ayuste' },
    { name: 'celia', id: 10, fullName: 'Cèlia Morales' },
    { name: 'patri', id: 6, fullName: 'Patri' }
    // Exempt: joan (id: 9) - already exists
];

const seedUsers = async () => {
    try {
        console.log('🌱 Seeding therapist users...');

        for (const t of THERAPISTS) {
            const email = `${t.name}@esencialmentepsicologia.com`;
            const password = `${t.name}123`;

            // Check if user exists (by email OR therapist_id)
            const check = await pool.query(
                'SELECT * FROM users WHERE email = $1 OR therapist_id = $2',
                [email, t.id]
            );

            if (check.rows.length > 0) {
                console.log(`⚠️ User for ${t.fullName} (${email}) already exists. Skipping.`);
                continue;
            }

            // Create user
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                `INSERT INTO users (username, email, password, role, is_active, therapist_id) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [t.name, email, hashedPassword, 'therapist', true, t.id]
            );
            console.log(`✅ Created user: ${t.name}`);
        }

        console.log('🏁 Seeding complete.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
