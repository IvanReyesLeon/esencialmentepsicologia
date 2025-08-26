// Script para crear el usuario administrador inicial
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createAdmin() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario administrador');
      console.log('Email:', existingAdmin.email);
      process.exit(0);
    }

    // Crear nuevo administrador
    const admin = new User({
      username: 'directora',
      email: 'directora@esencialmentepsicologia.com',
      password: 'admin123',
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📧 Email: directora@esencialmentepsicologia.com');
    console.log('🔑 Contraseña: admin123');
    console.log('');
    console.log('🚨 IMPORTANTE: Cambia la contraseña después del primer login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createAdmin();
