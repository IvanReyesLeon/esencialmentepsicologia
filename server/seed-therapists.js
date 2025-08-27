const mongoose = require('mongoose');
const Therapist = require('./models/Therapist');
require('dotenv').config();

const User = require('./models/User');

const therapists = [
  {
    fullName: "Anna Becerra",
    specialization: ["Directora", "Psicóloga sanitaria", "Psicoterapeuta integradora"],
    bio: "Anna es la directora del centro y cuenta con amplia experiencia en psicología clínica y terapia integradora. Su enfoque se centra en el bienestar integral de sus pacientes.",
    experience: 15,
    languages: ["Español", "Inglés"],
    photo: "anna_becerra.jpg",
    isActive: true,
    sessionTypes: ["individual", "couple", "family"]
  },
  {
    fullName: "Lucía Gómez",
    specialization: ["Psicoterapeuta Integradora", "EMDR"],
    bio: "Lucía es especialista en terapia EMDR (Eye Movement Desensitization and Reprocessing) y terapia integradora. Trabaja principalmente con trauma y trastornos de ansiedad.",
    experience: 8,
    languages: ["Español", "Catalán"],
    photo: "lucia_gomez.jpeg",
    isActive: true,
    sessionTypes: ["individual", "couple"]
  }
];

async function seedTherapists() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing therapists
    await Therapist.deleteMany({});
    console.log('Cleared existing therapists');

    // Create a dummy user for therapists (or get existing admin user)
    let adminUser = await User.findOne({ email: 'admin@esencialmentepsicologia.com' });
    if (!adminUser) {
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@esencialmentepsicologia.com',
        password: 'admin123', // This will be hashed by the pre-save middleware
        role: 'admin'
      });
    }

    // Add user reference to therapists
    const therapistsWithUser = therapists.map(therapist => ({
      ...therapist,
      user: adminUser._id
    }));

    // Insert new therapists
    const createdTherapists = await Therapist.insertMany(therapistsWithUser);
    console.log('Therapists seeded successfully:', createdTherapists.length);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding therapists:', error);
    process.exit(1);
  }
}

seedTherapists();
