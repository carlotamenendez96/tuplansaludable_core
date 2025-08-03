const mongoose = require('mongoose');

// Conectar a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tu-plan-saludable';

async function createTestData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Importar modelos
    const User = require('./src/models/User').default;
    const DietPlan = require('./src/models/DietPlan').default;
    const WorkoutPlan = require('./src/models/WorkoutPlan').default;

    console.log('🌱 Creando datos de prueba...');

    // Buscar o crear el entrenador
    let trainer = await User.findOne({ email: 'trainer@example.com' });
    
    if (!trainer) {
      trainer = await User.create({
        email: 'trainer@example.com',
        password: 'password123',
        firstName: 'Juan',
        lastName: 'Entrenador',
        role: 'TRAINER',
        isActive: true,
        clients: []
      });
      console.log('✅ Entrenador creado:', trainer.email);
    } else {
      console.log('✅ Entrenador encontrado:', trainer.email);
    }

    // Crear múltiples clientes
    const clientsData = [
      {
        email: 'carlota@email.com',
        firstName: 'Carlota',
        lastName: 'Rodriguez',
        role: 'USER',
        trainerId: trainer._id,
        isActive: true
      },
      {
        email: 'pedro@email.com',
        firstName: 'Pedro',
        lastName: 'Martinez',
        role: 'USER',
        trainerId: trainer._id,
        isActive: true
      },
      {
        email: 'maria@email.com',
        firstName: 'María',
        lastName: 'García',
        role: 'USER',
        trainerId: trainer._id,
        isActive: true
      },
      {
        email: 'carlos@email.com',
        firstName: 'Carlos',
        lastName: 'López',
        role: 'USER',
        trainerId: trainer._id,
        isActive: true
      }
    ];

    const createdClients = [];

    for (const clientData of clientsData) {
      let client = await User.findOne({ email: clientData.email });
      
      if (!client) {
        client = await User.create({
          ...clientData,
          password: 'password123'
        });
        console.log('✅ Cliente creado:', client.email);
      } else {
        console.log('✅ Cliente encontrado:', client.email);
      }
      
      createdClients.push(client);
    }

    // Actualizar la lista de clientes del entrenador
    const clientIds = createdClients.map(client => client._id);
    await User.findByIdAndUpdate(
      trainer._id,
      { $addToSet: { clients: { $each: clientIds } } }
    );

    console.log('✅ Lista de clientes actualizada para el entrenador');

    // Crear planes básicos para cada cliente
    for (const client of createdClients) {
      // Plan de dieta
      await DietPlan.findOneAndUpdate(
        { userId: client._id },
        {
          userId: client._id,
          trainerId: trainer._id,
          title: `Plan de Dieta - ${client.firstName}`,
          targetCalories: 2000,
          targetProtein: 150,
          targetCarbs: 250,
          targetFat: 60,
          meals: [],
          startDate: new Date(),
          isActive: true
        },
        { upsert: true }
      );

      // Plan de entrenamiento
      await WorkoutPlan.findOneAndUpdate(
        { userId: client._id },
        {
          userId: client._id,
          trainerId: trainer._id,
          title: `Plan de Entrenamiento - ${client.firstName}`,
          workouts: [],
          schedule: [],
          startDate: new Date(),
          isActive: true
        },
        { upsert: true }
      );
    }

    console.log('✅ Planes básicos creados para todos los clientes');
    console.log('📊 Resumen:');
    console.log(`   - Entrenador: ${trainer.firstName} ${trainer.lastName}`);
    console.log(`   - Clientes: ${createdClients.length}`);
    console.log(`   - Emails de clientes: ${createdClients.map(c => c.email).join(', ')}`);

    await mongoose.disconnect();
    console.log('✅ Datos de prueba creados exitosamente');

  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
    process.exit(1);
  }
}

createTestData(); 