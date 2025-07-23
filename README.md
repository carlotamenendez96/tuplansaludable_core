# Tu Plan Saludable - Backend API

Backend completo para la aplicación de salud y bienestar "Tu Plan Saludable", desarrollado con Node.js, TypeScript, Express, MongoDB y Socket.IO.

## 🚀 Características

- **Autenticación JWT** - Sistema seguro de autenticación y autorización
- **Gestión de Usuarios** - Roles de usuario (USER/TRAINER) con permisos específicos
- **Planes Personalizados** - Creación y gestión de planes de dieta y entrenamiento
- **Seguimiento de Progreso** - Registro detallado del progreso del usuario
- **Chat en Tiempo Real** - Comunicación entre entrenadores y clientes via WebSockets
- **Subida de Archivos** - Gestión de imágenes con soporte para AWS S3
- **API RESTful** - Endpoints bien estructurados y documentados
- **Validación de Datos** - Validación robusta con Joi
- **Seguridad** - Rate limiting, CORS, sanitización de datos
- **TypeScript** - Tipado estático para mayor confiabilidad

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **TypeScript** - Superset tipado de JavaScript
- **Express.js** - Framework web minimalista
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **Socket.IO** - Comunicación en tiempo real
- **JWT** - Autenticación basada en tokens
- **Joi** - Validación de esquemas
- **Multer** - Manejo de archivos
- **bcryptjs** - Hashing de contraseñas
- **Jest** - Framework de testing

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd tu-plan-saludable-backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus configuraciones:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/tu-plan-saludable
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   
   # AWS S3 Configuration (opcional)
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=tu-plan-saludable-images
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Iniciar MongoDB**
   ```bash
   # Si usas MongoDB local
   mongod
   
   # O usar Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

6. **Compilar para producción**
   ```bash
   npm run build
   npm start
   ```

## 📚 API Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/login` | Iniciar sesión | No |
| POST | `/register` | Registrar usuario | No |
| GET | `/me` | Obtener perfil del usuario | Sí |
| PUT | `/me` | Actualizar perfil | Sí |
| PUT | `/change-password` | Cambiar contraseña | Sí |
| POST | `/logout` | Cerrar sesión | Sí |

### Clientes (`/api/clients`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Lista de clientes (entrenadores) | Sí |
| GET | `/stats` | Estadísticas de clientes | Sí |
| GET | `/:clientId` | Información de cliente específico | Sí |
| POST | `/:clientId/assign` | Asignar cliente a entrenador | Sí |
| DELETE | `/:clientId/assign` | Desasignar cliente | Sí |

### Planes (`/api/plans`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/:userId/diet` | Obtener plan de dieta | Sí |
| PUT | `/:userId/diet` | Crear/actualizar plan de dieta | Sí |
| GET | `/:userId/workout` | Obtener plan de entrenamiento | Sí |
| PUT | `/:userId/workout` | Crear/actualizar plan de entrenamiento | Sí |
| GET | `/:userId/history` | Historial de planes | Sí |
| POST | `/:userId/deactivate` | Desactivar plan | Sí |

### Progreso (`/api/progress`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/:userId` | Obtener registros de progreso | Sí |
| POST | `/:userId` | Crear registro de progreso | Sí |
| PUT | `/:userId/:logId` | Actualizar registro | Sí |
| DELETE | `/:userId/:logId` | Eliminar registro | Sí |
| GET | `/:userId/summary` | Resumen de progreso | Sí |
| GET | `/:userId/stats` | Estadísticas por período | Sí |

### Chat (`/api/chat`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/conversations` | Conversaciones recientes | Sí |
| GET | `/unread` | Conteo de mensajes no leídos | Sí |
| GET | `/:partnerId` | Historial de mensajes | Sí |
| POST | `/:partnerId` | Enviar mensaje | Sí |
| PUT | `/:partnerId/read` | Marcar como leído | Sí |
| GET | `/:partnerId/search` | Buscar mensajes | Sí |
| DELETE | `/message/:messageId` | Eliminar mensaje | Sí |

### Archivos (`/api/upload`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/info` | Información de configuración | Sí |
| POST | `/profile` | Subir imagen de perfil | Sí |
| POST | `/progress` | Subir imágenes de progreso | Sí |
| POST | `/chat` | Subir archivos de chat | Sí |
| DELETE | `/image` | Eliminar imagen | Sí |
| POST | `/cleanup` | Limpiar archivos huérfanos | Sí |

## 🔐 Autenticación

El API usa JWT (JSON Web Tokens) para autenticación. Incluye el token en el header:

```
Authorization: Bearer <token>
```

### Roles de Usuario

- **USER**: Cliente que puede ver sus propios datos y comunicarse con su entrenador
- **TRAINER**: Entrenador que puede gestionar múltiples clientes y crear planes

## 🌐 WebSockets

El servidor soporta comunicación en tiempo real via Socket.IO:

### Eventos del Cliente

- `send_message` - Enviar mensaje
- `mark_as_read` - Marcar mensajes como leídos
- `typing_start` - Iniciar indicador de escritura
- `typing_stop` - Detener indicador de escritura
- `join_conversation` - Unirse a conversación
- `leave_conversation` - Salir de conversación

### Eventos del Servidor

- `new_message` - Nuevo mensaje recibido
- `message_sent` - Confirmación de mensaje enviado
- `messages_read` - Mensajes marcados como leídos
- `user_typing` - Usuario escribiendo
- `user_status` - Estado del usuario (online/offline)
- `notification` - Notificación general
- `progress_update` - Actualización de progreso
- `plan_update` - Actualización de plan

## 📁 Estructura del Proyecto

```
src/
├── config/          # Configuraciones
│   └── database.ts  # Configuración de MongoDB
├── controllers/     # Controladores de rutas
│   ├── authController.ts
│   ├── clientController.ts
│   ├── planController.ts
│   ├── progressController.ts
│   ├── chatController.ts
│   └── uploadController.ts
├── middleware/      # Middleware personalizado
│   ├── auth.ts      # Autenticación y autorización
│   ├── validation.ts # Validación de datos
│   └── security.ts  # Seguridad y rate limiting
├── models/          # Modelos de Mongoose
│   ├── User.ts
│   ├── DietPlan.ts
│   ├── WorkoutPlan.ts
│   ├── ProgressLog.ts
│   └── ChatMessage.ts
├── routes/          # Definición de rutas
│   ├── auth.ts
│   ├── clients.ts
│   ├── plans.ts
│   ├── progress.ts
│   ├── chat.ts
│   └── upload.ts
├── types/           # Definiciones de tipos TypeScript
│   └── index.ts
├── utils/           # Utilidades
│   ├── jwt.ts       # Manejo de JWT
│   ├── fileUpload.ts # Subida de archivos
│   └── socketService.ts # Servicio de WebSockets
└── index.ts         # Punto de entrada principal
```

## 🧪 Testing

Ejecutar tests:

```bash
# Todos los tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 🚀 Despliegue

### Variables de Entorno de Producción

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Monitoreo

### Endpoints de Salud

- `GET /health` - Estado básico del servidor
- `GET /api/health` - Estado detallado de la API

### Logs

Los logs se muestran en consola en desarrollo y se pueden configurar para producción.

## 🔒 Seguridad

- **Rate Limiting**: Límites de requests por IP
- **CORS**: Configuración de orígenes permitidos
- **Helmet**: Headers de seguridad
- **Sanitización**: Limpieza de datos de entrada
- **Validación**: Validación estricta con Joi
- **JWT**: Tokens seguros con expiración
- **bcrypt**: Hashing seguro de contraseñas

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:

- Email: support@tuplan-saludable.com
- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Documentación: [API Docs](https://api.tuplan-saludable.com/docs)

---

Desarrollado con ❤️ por el equipo de Tu Plan Saludable

