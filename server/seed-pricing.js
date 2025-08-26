const mongoose = require('mongoose');
const Pricing = require('./models/Pricing');
require('dotenv').config();

const seedPricing = async () => {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Eliminar precios existentes
    await Pricing.deleteMany({});
    console.log('🗑️ Precios existentes eliminados');

    // Crear nuevos precios según la captura
    const pricingData = [
      {
        sessionType: 'individual',
        price: 55,
        duration: 60,
        description: 'Sesión individual de terapia psicológica - 60 minutos, de lunes a viernes, presencial y online, de 9:00h a 20:00h'
      },
      {
        sessionType: 'couple',
        price: 80,
        duration: 90,
        description: 'Sesión de terapia de pareja o familiar - 90 minutos, de lunes a viernes, presencial, de 9:00h a 20:00h'
      }
    ];

    const createdPricing = await Pricing.insertMany(pricingData);
    console.log('✅ Precios creados:', createdPricing.length);

    console.log('🎉 Seed de precios completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed de precios:', error);
    process.exit(1);
  }
};

seedPricing();
