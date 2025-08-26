const mongoose = require('mongoose');
const Therapist = require('./models/Therapist');

async function checkTherapists() {
  try {
    await mongoose.connect('mongodb://localhost:27017/psychology-clinic');
    console.log('Conectado a MongoDB');
    
    const therapists = await Therapist.find({});
    console.log('\n=== Terapeutas en la base de datos ===');
    
    if (therapists.length === 0) {
      console.log('No hay terapeutas en la base de datos');
    } else {
      therapists.forEach((therapist, index) => {
        console.log(`${index + 1}. ${therapist.fullName}`);
        console.log(`   Foto: "${therapist.photo}"`);
        console.log(`   ID: ${therapist._id}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTherapists();
