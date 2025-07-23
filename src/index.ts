import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';

// Importar configuración de base de datos
import { connectDatabase } from './config/database';

// Importar middleware de seguridad
import {
  corsOptions,
  helmetConfig,
  generalLimiter,
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateContentType,
  sanitizeInput
} from './middleware/security';

// Importar rutas
import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import planRoutes from './routes/plans';
import progressRoutes from './routes/progress';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';

// Importar servicio de WebSocket
import SocketService from './utils/socketService';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();
const server = createServer(app);

// Configurar puerto
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Inicializar servicio de WebSocket
const socketService = new SocketService(server);

// Middleware básico
app.use(helmetConfig); // Seguridad
app.use(compression()); // Compresión
app.use(express.json({ limit: '10mb' })); // Parser JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parser URL-encoded

// CORS
const cors = require('cors');
app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(requestLogger);
}

// Rate limiting
app.use(generalLimiter);

// Middleware de validación y sanitización
app.use(validateContentType);
app.use(sanitizeInput);

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor funcionando correctamente',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando correctamente',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: 'connected', // En un entorno real, verificar conexión a DB
      websocket: 'active',
      connectedUsers: socketService.getConnectedUsersCount()
    }
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenido a Tu Plan Saludable API',
    data: {
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/api/health',
      endpoints: {
        auth: '/api/auth',
        clients: '/api/clients',
        plans: '/api/plans',
        progress: '/api/progress',
        chat: '/api/chat',
        upload: '/api/upload'
      }
    }
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(notFoundHandler);
app.use(errorHandler);

// Función para iniciar el servidor
const startServer = async (): Promise<void> => {
  try {
    // Conectar a la base de datos
    await connectDatabase();
    
    // Iniciar servidor
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Servidor iniciado exitosamente\n📍 Puerto: ${PORT}\n🌍 Entorno: ${process.env.NODE_ENV || 'development'}\n🔗 URL: http://localhost:${PORT}\n📚 API: http://localhost:${PORT}/api\n💬 WebSocket: Activo\n📊 Salud: http://localhost:${PORT}/api/health`);
    });

    // Manejar cierre graceful
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor...`);
      
      server.close(() => {
        console.log('✅ Servidor HTTP cerrado');
        
        // Cerrar conexiones de WebSocket
        socketService.getIO().close(() => {
          console.log('✅ Servidor WebSocket cerrado');
          process.exit(0);
        });
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('❌ Forzando cierre del servidor');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de terminación
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejar errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor solo si este archivo es ejecutado directamente
if (require.main === module) {
  startServer();
}

// Exportar app para testing
export default app;
export { socketService };


