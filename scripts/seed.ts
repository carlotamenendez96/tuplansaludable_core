import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { DietPlan } from '../src/models/DietPlan';
import { WorkoutPlan } from '../src/models/WorkoutPlan';
import { ChatMessage } from '../src/models/ChatMessage';
import { ProgressLog } from '../src/models/ProgressLog';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tu-plan-saludable';

async function seed() {
  await mongoose.connect(MONGODB_URI);

  // Limpia las colecciones (opcional)
//   await User.deleteMany({});
//   await DietPlan.deleteMany({});
//   await WorkoutPlan.deleteMany({});
//   await ChatMessage.deleteMany({});
//   await ProgressLog.deleteMany({});

  // Crea un usuario entrenador y uno cliente
  const trainer = await User.create({
    email: 'trainer@example.com',
    password: 'password123',
    firstName: 'Entrenador',
    lastName: 'Ejemplo',
    role: 'TRAINER',
    isActive: true
  });

  const client = await User.create({
    email: 'client@example.com',
    password: 'password123',
    firstName: 'Cliente',
    lastName: 'Ejemplo',
    role: 'USER',
    trainerId: trainer._id,
    isActive: true
  });

  // Crea un plan de dieta de ejemplo
  await DietPlan.create({
    userId: client._id,
    trainerId: trainer._id,
    title: 'Plan de dieta ejemplo',
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 250,
    targetFat: 60,
    meals: [],
    startDate: new Date(),
    isActive: true
  });

  // Crea un plan de entrenamiento de ejemplo
  await WorkoutPlan.create({
    userId: client._id,
    trainerId: trainer._id,
    title: 'Plan de entrenamiento ejemplo',
    workouts: [],
    schedule: [],
    startDate: new Date(),
    isActive: true
  });

  // Crea un mensaje de chat de ejemplo
  await ChatMessage.create({
    senderId: trainer._id,
    receiverId: client._id,
    message: '¡Bienvenido al plan!',
    messageType: 'text',
    isRead: false
  });

  // Crea un registro de progreso de ejemplo
  await ProgressLog.create({
    userId: client._id,
    date: new Date(),
    weight: 70,
    bodyFat: 20,
    muscleMass: 30
  });

  console.log('✅ Datos de ejemplo insertados');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Error al hacer seed:', err);
  process.exit(1);
});