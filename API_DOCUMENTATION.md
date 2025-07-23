# Tu Plan Saludable - Documentación de API

## Información General

- **Base URL**: `http://localhost:5000/api`
- **Autenticación**: Bearer Token (JWT)
- **Formato de Respuesta**: JSON
- **Versión**: 1.0.0

## Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Descripción del resultado",
  "data": {
    // Datos de respuesta
  }
}
```

### Respuesta con Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "ERROR_CODE",
  "errors": [
    {
      "field": "campo",
      "message": "mensaje de error"
    }
  ]
}
```

### Respuesta Paginada
```json
{
  "success": true,
  "message": "Datos obtenidos exitosamente",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Autenticación

### Registrar Usuario
**POST** `/auth/register`

```json
{
  "email": "usuario@example.com",
  "password": "Password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "USER",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "height": 175,
  "weight": 70,
  "activityLevel": "MODERATELY_ACTIVE",
  "goals": ["LOSE_WEIGHT", "IMPROVE_FITNESS"],
  "medicalConditions": ["Diabetes"],
  "allergies": ["Nueces"],
  "trainerId": "60d5ecb74b24a1234567890a"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60d5ecb74b24a1234567890b",
      "email": "usuario@example.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "USER",
      "profilePicture": null
    }
  }
}
```

### Iniciar Sesión
**POST** `/auth/login`

```json
{
  "email": "usuario@example.com",
  "password": "Password123"
}
```

### Obtener Perfil
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Información del usuario obtenida exitosamente",
  "data": {
    "id": "60d5ecb74b24a1234567890b",
    "email": "usuario@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "USER",
    "profilePicture": "/uploads/profiles/image.jpg",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "gender": "male",
    "height": 175,
    "weight": 70,
    "activityLevel": "MODERATELY_ACTIVE",
    "goals": ["LOSE_WEIGHT", "IMPROVE_FITNESS"],
    "medicalConditions": ["Diabetes"],
    "allergies": ["Nueces"],
    "trainerId": {
      "id": "60d5ecb74b24a1234567890a",
      "firstName": "Carlos",
      "lastName": "Entrenador",
      "email": "entrenador@example.com"
    },
    "fullName": "Juan Pérez",
    "age": 33,
    "bmi": 22.9,
    "clientCount": 0
  }
}
```

## Gestión de Clientes

### Obtener Lista de Clientes
**GET** `/clients`

**Query Parameters:**
- `page` (number): Página (default: 1)
- `limit` (number): Elementos por página (default: 10)
- `search` (string): Búsqueda por nombre o email
- `sortBy` (string): Campo de ordenamiento
- `sortOrder` (string): asc/desc

**Respuesta:**
```json
{
  "success": true,
  "message": "Lista de clientes obtenida exitosamente",
  "data": [
    {
      "id": "60d5ecb74b24a1234567890b",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan@example.com",
      "profilePicture": "/uploads/profiles/image.jpg",
      "fullName": "Juan Pérez",
      "age": 33,
      "bmi": 22.9,
      "lastProgress": {
        "date": "2023-12-01T00:00:00.000Z",
        "weight": 70,
        "mood": 8,
        "energyLevel": 7
      },
      "activePlans": {
        "diet": "Plan de Pérdida de Peso",
        "workout": "Rutina Principiante"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Obtener Cliente Específico
**GET** `/clients/:clientId`

### Asignar Cliente
**POST** `/clients/:clientId/assign`

### Estadísticas de Clientes
**GET** `/clients/stats`

## Planes de Dieta y Entrenamiento

### Obtener Plan de Dieta
**GET** `/plans/:userId/diet`

**Respuesta:**
```json
{
  "success": true,
  "message": "Plan de dieta obtenido exitosamente",
  "data": {
    "id": "60d5ecb74b24a1234567890c",
    "userId": "60d5ecb74b24a1234567890b",
    "trainerId": "60d5ecb74b24a1234567890a",
    "title": "Plan de Pérdida de Peso",
    "description": "Plan diseñado para pérdida gradual de peso",
    "targetCalories": 1800,
    "targetProtein": 120,
    "targetCarbs": 180,
    "targetFat": 60,
    "meals": [
      {
        "type": "BREAKFAST",
        "foods": [
          {
            "food": {
              "name": "Avena",
              "calories": 389,
              "protein": 16.9,
              "carbs": 66.3,
              "fat": 6.9,
              "fiber": 10.6
            },
            "quantity": 50
          }
        ],
        "totalCalories": 195,
        "notes": "Agregar frutas al gusto"
      }
    ],
    "startDate": "2023-12-01T00:00:00.000Z",
    "endDate": "2024-01-01T00:00:00.000Z",
    "isActive": true,
    "actualMacros": {
      "calories": 1750,
      "protein": 115,
      "carbs": 175,
      "fat": 58,
      "fiber": 25
    },
    "macroDistribution": {
      "protein": 26,
      "carbs": 40,
      "fat": 30
    },
    "durationDays": 31,
    "isCurrent": true
  }
}
```

### Crear/Actualizar Plan de Dieta
**PUT** `/plans/:userId/diet`

```json
{
  "title": "Plan de Pérdida de Peso",
  "description": "Plan diseñado para pérdida gradual de peso",
  "targetCalories": 1800,
  "targetProtein": 120,
  "targetCarbs": 180,
  "targetFat": 60,
  "meals": [
    {
      "type": "BREAKFAST",
      "foods": [
        {
          "food": {
            "name": "Avena",
            "calories": 389,
            "protein": 16.9,
            "carbs": 66.3,
            "fat": 6.9,
            "fiber": 10.6
          },
          "quantity": 50
        }
      ],
      "notes": "Agregar frutas al gusto"
    }
  ],
  "startDate": "2023-12-01",
  "endDate": "2024-01-01",
  "notes": "Seguir estrictamente durante 4 semanas"
}
```

### Obtener Plan de Entrenamiento
**GET** `/plans/:userId/workout`

**Respuesta:**
```json
{
  "success": true,
  "message": "Plan de entrenamiento obtenido exitosamente",
  "data": {
    "id": "60d5ecb74b24a1234567890d",
    "title": "Rutina Principiante",
    "description": "Rutina para principiantes en el gimnasio",
    "workouts": [
      {
        "name": "Día de Pecho y Tríceps",
        "exercises": [
          {
            "exercise": {
              "name": "Press de Banca",
              "type": "STRENGTH",
              "description": "Ejercicio básico para pecho",
              "targetMuscles": ["Pectorales", "Tríceps", "Deltoides"],
              "equipment": ["Barra", "Banco"],
              "difficulty": "intermediate"
            },
            "sets": [
              {
                "reps": 12,
                "weight": 60,
                "restTime": 90
              },
              {
                "reps": 10,
                "weight": 65,
                "restTime": 90
              }
            ],
            "notes": "Mantener control en todo el movimiento"
          }
        ],
        "estimatedDuration": 60,
        "difficulty": "beginner"
      }
    ],
    "schedule": [
      {
        "dayOfWeek": 1,
        "workoutIndex": 0
      },
      {
        "dayOfWeek": 3,
        "workoutIndex": 1
      }
    ],
    "weeklyWorkouts": 2,
    "totalExercises": 8,
    "averageWorkoutDuration": 60,
    "targetedMuscleGroups": ["pectorales", "tríceps", "deltoides"],
    "weeklyDuration": 120,
    "todaysWorkout": null,
    "isCurrent": true
  }
}
```

## Seguimiento de Progreso

### Obtener Registros de Progreso
**GET** `/progress/:userId`

**Query Parameters:**
- `page`, `limit`: Paginación
- `startDate`, `endDate`: Filtro por fechas
- `sortBy`, `sortOrder`: Ordenamiento

### Crear Registro de Progreso
**POST** `/progress/:userId`

```json
{
  "date": "2023-12-01",
  "weight": 70.5,
  "bodyFat": 15.2,
  "muscleMass": 55.8,
  "measurements": {
    "chest": 95,
    "waist": 80,
    "hips": 90,
    "arms": 35,
    "thighs": 55,
    "neck": 38
  },
  "photos": [
    "/uploads/progress/front.jpg",
    "/uploads/progress/side.jpg"
  ],
  "mood": 8,
  "energyLevel": 7,
  "sleepHours": 7.5,
  "waterIntake": 2.5,
  "notes": "Me siento con más energía",
  "workoutCompleted": {
    "duration": 60,
    "caloriesBurned": 350,
    "exercises": [
      {
        "exerciseName": "Press de Banca",
        "setsCompleted": 3,
        "notes": "Aumenté el peso"
      }
    ]
  },
  "nutritionLog": {
    "mealsLogged": 4,
    "totalCalories": 1850,
    "totalProtein": 125,
    "totalCarbs": 185,
    "totalFat": 62
  }
}
```

### Resumen de Progreso
**GET** `/progress/:userId/summary?days=30`

**Respuesta:**
```json
{
  "success": true,
  "message": "Resumen de progreso obtenido exitosamente",
  "data": {
    "period": {
      "days": 30,
      "startDate": "2023-11-01T00:00:00.000Z",
      "endDate": "2023-12-01T00:00:00.000Z"
    },
    "statistics": {
      "totalLogs": 25,
      "avgWeight": 70.2,
      "avgBodyFat": 15.5,
      "avgMood": 7.8,
      "avgEnergyLevel": 7.5,
      "avgSleepHours": 7.2,
      "totalWorkouts": 18,
      "totalWorkoutTime": 1080,
      "avgCompletionScore": 85
    },
    "trends": {
      "weight": [
        { "date": "2023-11-01", "weight": 72.0 },
        { "date": "2023-11-15", "weight": 71.2 },
        { "date": "2023-12-01", "weight": 70.5 }
      ],
      "weightChange": -1.5
    },
    "latestLog": {
      // Último registro completo
    }
  }
}
```

## Sistema de Chat

### Obtener Conversaciones
**GET** `/chat/conversations?limit=10`

**Respuesta:**
```json
{
  "success": true,
  "message": "Conversaciones obtenidas exitosamente",
  "data": [
    {
      "partnerId": "60d5ecb74b24a1234567890a",
      "partnerName": "Carlos Entrenador",
      "partnerProfilePicture": "/uploads/profiles/trainer.jpg",
      "partnerRole": "TRAINER",
      "lastMessage": "¿Cómo te fue con el entrenamiento de hoy?",
      "lastMessageType": "text",
      "lastMessageTime": "2023-12-01T15:30:00.000Z",
      "unreadCount": 2,
      "isLastMessageFromMe": false,
      "lastMessageAge": 30,
      "isLastMessageFromToday": true
    }
  ]
}
```

### Obtener Mensajes
**GET** `/chat/:partnerId?page=1&limit=50`

**Respuesta:**
```json
{
  "success": true,
  "message": "Mensajes obtenidos exitosamente",
  "data": [
    {
      "id": "60d5ecb74b24a1234567890e",
      "senderId": {
        "id": "60d5ecb74b24a1234567890a",
        "firstName": "Carlos",
        "lastName": "Entrenador",
        "profilePicture": "/uploads/profiles/trainer.jpg"
      },
      "receiverId": {
        "id": "60d5ecb74b24a1234567890b",
        "firstName": "Juan",
        "lastName": "Pérez",
        "profilePicture": "/uploads/profiles/user.jpg"
      },
      "message": "¿Cómo te fue con el entrenamiento de hoy?",
      "messageType": "text",
      "attachments": [],
      "isRead": false,
      "readAt": null,
      "createdAt": "2023-12-01T15:30:00.000Z",
      "isFromMe": false,
      "ageInMinutes": 30,
      "formattedTime": "15:30",
      "isFromToday": true,
      "isRecent": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Enviar Mensaje
**POST** `/chat/:partnerId`

```json
{
  "message": "El entrenamiento estuvo excelente, aumenté el peso en press de banca",
  "messageType": "text",
  "attachments": []
}
```

### Marcar como Leído
**PUT** `/chat/:partnerId/read`

### Buscar Mensajes
**GET** `/chat/:partnerId/search?query=entrenamiento&page=1&limit=20`

## Subida de Archivos

### Información de Configuración
**GET** `/upload/info`

**Respuesta:**
```json
{
  "success": true,
  "message": "Información de configuración de upload obtenida",
  "data": {
    "maxFileSize": 5242880,
    "maxFiles": 5,
    "allowedTypes": [
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/gif",
      "image/webp"
    ],
    "useS3": false,
    "maxFileSizeMB": 5
  }
}
```

### Subir Imagen de Perfil
**POST** `/upload/profile`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `profileImage`: Archivo de imagen

### Subir Imágenes de Progreso
**POST** `/upload/progress`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `progressImages`: Array de archivos de imagen (máximo 5)

### Subir Archivos de Chat
**POST** `/upload/chat`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `chatFiles`: Array de archivos (máximo 3)

## WebSocket Events

### Conexión
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Eventos del Cliente
```javascript
// Enviar mensaje
socket.emit('send_message', {
  receiverId: '60d5ecb74b24a1234567890a',
  message: 'Hola, ¿cómo estás?',
  messageType: 'text'
});

// Marcar como leído
socket.emit('mark_as_read', {
  senderId: '60d5ecb74b24a1234567890a'
});

// Indicador de escritura
socket.emit('typing_start', {
  receiverId: '60d5ecb74b24a1234567890a'
});

socket.emit('typing_stop', {
  receiverId: '60d5ecb74b24a1234567890a'
});
```

### Eventos del Servidor
```javascript
// Nuevo mensaje
socket.on('new_message', (message) => {
  console.log('Nuevo mensaje:', message);
});

// Usuario escribiendo
socket.on('user_typing', (data) => {
  console.log('Usuario escribiendo:', data);
});

// Estado del usuario
socket.on('user_status', (data) => {
  console.log('Estado del usuario:', data);
});

// Notificaciones
socket.on('notification', (notification) => {
  console.log('Notificación:', notification);
});
```

## Códigos de Error

### Autenticación
- `NO_TOKEN`: Token no proporcionado
- `INVALID_TOKEN`: Token inválido o expirado
- `NOT_AUTHENTICATED`: Usuario no autenticado
- `INSUFFICIENT_PERMISSIONS`: Permisos insuficientes

### Validación
- `VALIDATION_ERROR`: Error de validación de datos
- `INVALID_ID`: ID de MongoDB inválido
- `MISSING_REQUIRED_FIELD`: Campo requerido faltante

### Recursos
- `USER_NOT_FOUND`: Usuario no encontrado
- `CLIENT_NOT_FOUND`: Cliente no encontrado
- `PLAN_NOT_FOUND`: Plan no encontrado
- `MESSAGE_NOT_FOUND`: Mensaje no encontrado

### Archivos
- `FILE_TOO_LARGE`: Archivo demasiado grande
- `INVALID_FILE_TYPE`: Tipo de archivo no permitido
- `TOO_MANY_FILES`: Demasiados archivos

### Rate Limiting
- `RATE_LIMIT_EXCEEDED`: Límite de requests excedido
- `AUTH_RATE_LIMIT_EXCEEDED`: Límite de autenticación excedido

## Límites y Restricciones

### Rate Limiting
- **General**: 100 requests por 15 minutos
- **Autenticación**: 5 intentos por 15 minutos
- **Creación**: 10 creaciones por minuto
- **Subida de archivos**: 5 subidas por minuto

### Archivos
- **Tamaño máximo**: 5MB por archivo
- **Archivos máximos**: 5 por request
- **Tipos permitidos**: JPEG, PNG, GIF, WebP

### Datos
- **Mensaje de chat**: 2000 caracteres máximo
- **Notas**: 1000 caracteres máximo
- **Nombre de usuario**: 50 caracteres máximo

---

Para más información o soporte, contacta al equipo de desarrollo.

