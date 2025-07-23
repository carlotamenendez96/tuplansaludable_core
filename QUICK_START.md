# Tu Plan Saludable - Guía de Inicio Rápido

## 🚀 Instalación Rápida

### 1. Prerrequisitos
```bash
# Verificar versiones
node --version  # >= 18.0.0
npm --version   # >= 8.0.0
mongod --version # >= 5.0.0
```

### 2. Instalación
```bash
# Clonar e instalar
git clone <repository-url>
cd tu-plan-saludable-backend
npm install

# Configurar variables de entorno
cp .env.example .env
```

### 3. Configuración Mínima (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/tu-plan-saludable
JWT_SECRET=tu-super-secreto-jwt-aqui-muy-largo-y-seguro
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### 4. Iniciar Servicios
```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Aplicación
npm run dev
```

### 5. Verificar Instalación
```bash
# Verificar salud del servidor
curl http://localhost:5000/health

# Verificar API
curl http://localhost:5000/api/health
```

## 🧪 Prueba Rápida

### 1. Registrar Usuario
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "firstName": "Test",
    "lastName": "User",
    "role": "USER"
  }'
```

### 2. Iniciar Sesión
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

### 3. Obtener Perfil (usar token de respuesta anterior)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar en modo desarrollo
npm run build        # Compilar TypeScript
npm start           # Iniciar en producción

# Testing
npm test            # Ejecutar tests
npm run test:watch  # Tests en modo watch
npm run test:coverage # Tests con coverage

# Utilidades
npm run lint        # Verificar código
npm run format      # Formatear código
```

## 📁 Estructura Básica

```
tu-plan-saludable-backend/
├── src/
│   ├── controllers/     # Lógica de negocio
│   ├── models/         # Modelos de datos
│   ├── routes/         # Definición de rutas
│   ├── middleware/     # Middleware personalizado
│   ├── utils/          # Utilidades
│   └── index.ts        # Punto de entrada
├── tests/              # Tests automatizados
├── uploads/            # Archivos subidos (local)
├── .env               # Variables de entorno
└── package.json       # Configuración del proyecto
```

## 🌐 Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener perfil |
| GET | `/api/clients` | Lista de clientes |
| GET | `/api/plans/:userId/diet` | Plan de dieta |
| GET | `/api/progress/:userId` | Progreso del usuario |
| GET | `/api/chat/conversations` | Conversaciones |

## 🔒 Autenticación

Incluir en headers de requests autenticados:
```
Authorization: Bearer <jwt-token>
```

## 🐛 Solución de Problemas

### MongoDB no conecta
```bash
# Verificar que MongoDB esté ejecutándose
sudo systemctl status mongod

# O iniciar manualmente
mongod --dbpath /data/db
```

### Puerto ocupado
```bash
# Cambiar puerto en .env
PORT=5001

# O matar proceso en puerto 5000
lsof -ti:5000 | xargs kill -9
```

### Errores de permisos
```bash
# Dar permisos a directorio uploads
chmod 755 uploads/
```

## 📞 Soporte

- **Logs**: Revisar consola para errores detallados
- **Health Check**: `GET /api/health` para estado del sistema
- **Documentación**: Ver `README.md` y `API_DOCUMENTATION.md`

---

¡Listo para desarrollar! 🎉

