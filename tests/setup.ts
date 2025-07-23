import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar variables de entorno para testing
dotenv.config({ path: '.env.test' });

let mongoServer: MongoMemoryServer;

// Configuración global antes de todos los tests
beforeAll(async () => {
  // Crear servidor MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Conectar a MongoDB
  await mongoose.connect(mongoUri);
});

// Limpiar después de cada test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Limpiar después de todos los tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Configurar timeout global
jest.setTimeout(10000);

