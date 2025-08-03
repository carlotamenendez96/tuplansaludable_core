# Completar Documentación Swagger

El archivo `swagger.json` ya contiene la estructura base y los endpoints de autenticación y clientes. Para completar la documentación, necesitas agregar los siguientes endpoints:

## Endpoints Pendientes

### 1. Plans (Planes de Dieta y Entrenamiento)

#### GET /api/plans/{userId}/diet
- Obtener plan de dieta activo de un usuario
- Parámetros: userId (path)
- Respuesta: DietPlan

#### PUT /api/plans/{userId}/diet
- Crear o actualizar plan de dieta
- Parámetros: userId (path)
- Body: DietPlan (sin _id, userId, trainerId, createdAt, updatedAt)
- Respuesta: DietPlan

#### GET /api/plans/{userId}/workout
- Obtener plan de entrenamiento activo
- Parámetros: userId (path)
- Respuesta: WorkoutPlan

#### PUT /api/plans/{userId}/workout
- Crear o actualizar plan de entrenamiento
- Parámetros: userId (path)
- Body: WorkoutPlan (sin _id, userId, trainerId, createdAt, updatedAt)
- Respuesta: WorkoutPlan

#### GET /api/plans/{userId}/history
- Obtener historial de planes
- Parámetros: userId (path)
- Query: type (diet/workout), page, limit
- Respuesta: Array de DietPlan/WorkoutPlan

#### POST /api/plans/{userId}/deactivate
- Desactivar plan activo
- Parámetros: userId (path)
- Body: { type: "diet" | "workout" }
- Respuesta: ApiResponse

### 2. Progress (Seguimiento de Progreso)

#### GET /api/progress/{userId}
- Obtener registros de progreso
- Parámetros: userId (path)
- Query: page, limit, startDate, endDate, sortBy, sortOrder
- Respuesta: PaginatedResponse con ProgressLog

#### POST /api/progress/{userId}
- Crear registro de progreso
- Parámetros: userId (path)
- Body: ProgressLog (sin _id, userId, createdAt, updatedAt)
- Respuesta: ProgressLog

#### PUT /api/progress/{userId}/{logId}
- Actualizar registro de progreso
- Parámetros: userId, logId (path)
- Body: ProgressLog (sin _id, userId, createdAt, updatedAt)
- Respuesta: ProgressLog

#### DELETE /api/progress/{userId}/{logId}
- Eliminar registro de progreso
- Parámetros: userId, logId (path)
- Respuesta: ApiResponse

#### GET /api/progress/{userId}/summary
- Obtener resumen de progreso
- Parámetros: userId (path)
- Query: days (default: 30)
- Respuesta: ProgressSummary

#### GET /api/progress/{userId}/stats
- Obtener estadísticas de progreso
- Parámetros: userId (path)
- Query: period (week/month/year)
- Respuesta: ProgressStats

### 3. Chat (Mensajería)

#### GET /api/chat/conversations
- Obtener conversaciones recientes
- Query: limit
- Respuesta: Array de Conversation

#### GET /api/chat/unread
- Obtener conteo de mensajes no leídos
- Respuesta: { count: number }

#### GET /api/chat/{partnerId}
- Obtener historial de mensajes
- Parámetros: partnerId (path)
- Query: page, limit
- Respuesta: PaginatedResponse con ChatMessage

#### POST /api/chat/{partnerId}
- Enviar mensaje
- Parámetros: partnerId (path)
- Body: { message: string, messageType: "text"|"image"|"file", attachments?: string[] }
- Respuesta: ChatMessage

#### PUT /api/chat/{partnerId}/read
- Marcar mensajes como leídos
- Parámetros: partnerId (path)
- Respuesta: ApiResponse

#### GET /api/chat/{partnerId}/search
- Buscar mensajes
- Parámetros: partnerId (path)
- Query: query, page, limit
- Respuesta: PaginatedResponse con ChatMessage

#### DELETE /api/chat/message/{messageId}
- Eliminar mensaje
- Parámetros: messageId (path)
- Respuesta: ApiResponse

### 4. Upload (Gestión de Archivos)

#### GET /api/upload/info
- Obtener información de configuración
- Respuesta: UploadConfig

#### POST /api/upload/profile
- Subir imagen de perfil
- Content-Type: multipart/form-data
- Body: profileImage (file)
- Respuesta: { url: string }

#### POST /api/upload/progress
- Subir imágenes de progreso
- Content-Type: multipart/form-data
- Body: progressImages (files, max 5)
- Respuesta: Array de URLs

#### POST /api/upload/chat
- Subir archivos para chat
- Content-Type: multipart/form-data
- Body: chatFiles (files, max 3)
- Respuesta: Array de URLs

#### DELETE /api/upload/image
- Eliminar imagen
- Body: { imageUrl: string }
- Respuesta: ApiResponse

#### POST /api/upload/cleanup
- Limpiar archivos huérfanos
- Solo entrenadores
- Respuesta: ApiResponse

## Esquemas Adicionales Necesarios

### ProgressSummary
```json
{
  "type": "object",
  "properties": {
    "totalLogs": { "type": "number" },
    "avgWeight": { "type": "number" },
    "avgBodyFat": { "type": "number" },
    "avgMood": { "type": "number" },
    "avgEnergyLevel": { "type": "number" },
    "avgSleepHours": { "type": "number" },
    "avgWaterIntake": { "type": "number" },
    "totalWorkouts": { "type": "number" },
    "totalWorkoutTime": { "type": "number" }
  }
}
```

### ProgressStats
```json
{
  "type": "object",
  "properties": {
    "period": { "type": "string", "enum": ["week", "month", "year"] },
    "weightChange": { "type": "number" },
    "bodyFatChange": { "type": "number" },
    "workoutCount": { "type": "number" },
    "totalWorkoutTime": { "type": "number" },
    "avgMood": { "type": "number" },
    "avgEnergyLevel": { "type": "number" }
  }
}
```

### Conversation
```json
{
  "type": "object",
  "properties": {
    "partnerId": { "type": "string", "format": "objectId" },
    "partnerName": { "type": "string" },
    "partnerProfilePicture": { "type": "string", "format": "uri" },
    "lastMessage": { "type": "string" },
    "lastMessageType": { "type": "string", "enum": ["text", "image", "file"] },
    "lastMessageTime": { "type": "string", "format": "date-time" },
    "unreadCount": { "type": "number" },
    "isLastMessageFromMe": { "type": "boolean" }
  }
}
```

### UploadConfig
```json
{
  "type": "object",
  "properties": {
    "maxFileSize": { "type": "number" },
    "allowedTypes": { "type": "array", "items": { "type": "string" } },
    "maxFiles": { "type": "number" }
  }
}
```

## Instrucciones para Completar

1. Agregar los endpoints de Plans después de los endpoints de Clients
2. Agregar los endpoints de Progress después de Plans
3. Agregar los endpoints de Chat después de Progress
4. Agregar los endpoints de Upload después de Chat
5. Agregar los esquemas adicionales en la sección `components.schemas`
6. Verificar que todos los endpoints tengan:
   - Tags apropiados
   - Security cuando sea necesario
   - Parámetros correctos
   - Respuestas documentadas
   - Códigos de error apropiados

## Ejemplo de Estructura

```json
{
  "paths": {
    // ... endpoints existentes ...
    "/api/plans/{userId}/diet": {
      "get": {
        "tags": ["Plans"],
        "summary": "Obtener plan de dieta",
        "description": "Obtener el plan de dieta activo de un usuario",
        "security": [{"bearerAuth": []}],
        "parameters": [
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "schema": {"type": "string", "format": "objectId"}
          }
        ],
        "responses": {
          "200": {
            "description": "Plan de dieta obtenido",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                    "data": {"$ref": "#/components/schemas/DietPlan"}
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Validación

Una vez completado, puedes validar el archivo Swagger usando:
- Swagger Editor online
- Herramientas de validación de OpenAPI 3.0
- Generadores de documentación como Swagger UI 