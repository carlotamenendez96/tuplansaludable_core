import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tu-plan-saludable';

export const connectDatabase = async (): Promise<void> => {
  try {
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      bufferCommands: false, // Disable mongoose buffering
    };

    await mongoose.connect(MONGODB_URI, options);
    
    console.log('✅ Conectado a MongoDB exitosamente');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ Error de conexión a MongoDB:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Desconectado de MongoDB');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Reconectado a MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔒 Conexión a MongoDB cerrada debido a terminación de la aplicación');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error al cerrar la conexión a MongoDB:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('🔒 Conexión a MongoDB cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar la conexión a MongoDB:', error);
  }
};

