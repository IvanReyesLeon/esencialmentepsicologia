const mongoose = require('mongoose');
const Therapist = require('./models/Therapist');

async function fixTherapistPhotos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/psychology-clinic');
    console.log('Conectado a MongoDB');
    
    // Actualizar Anna Becerra
    await Therapist.findOneAndUpdate(
      { fullName: /Anna.*Becerra/i },
      { photo: 'anna_becerra.jpg' }
    );
    
    // Actualizar Lucía Gómez
    await Therapist.findOneAndUpdate(
      { fullName: /Luc[ií]a.*G[óo]mez/i },
      { photo: 'lucia_gomez.jpeg' }
    );
    
    console.log('Fotos de terapeutas actualizadas correctamente');
    
    // Verificar los cambios
    const therapists = await Therapist.find({});
    console.log('\n=== Terapeutas actualizados ===');
    therapists.forEach(t => {
      console.log(`- ${t.fullName}: foto = "${t.photo}"`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixTherapistPhotos();
