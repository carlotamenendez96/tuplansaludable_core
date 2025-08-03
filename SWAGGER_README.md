# Documentación Swagger - Tu Plan Saludable API

## Descripción

Este proyecto incluye una documentación completa de la API usando OpenAPI 3.0 (Swagger). La documentación está disponible tanto en formato JSON como a través de una interfaz web interactiva.

## Archivos de Documentación

- `swagger.json` - Especificación completa de la API en formato OpenAPI 3.0
- `SWAGGER_COMPLETION.md` - Guía para completar los endpoints pendientes
- `src/routes/docs.ts` - Servidor de documentación Swagger UI

## Endpoints de Documentación

### Interfaz Web
- **URL**: `http://localhost:5000/api/docs`
- **Descripción**: Interfaz interactiva de Swagger UI para probar la API
- **Características**:
  - Interfaz en español
  - Autenticación automática con JWT
  - Botón para limpiar token
  - Filtros y búsqueda
  - Pruebas en tiempo real

### Especificación JSON
- **URL**: `http://localhost:5000/api/docs/swagger.json`
- **Descripción**: Especificación completa en formato JSON
- **Uso**: Para herramientas de generación de código, validación, etc.

## Endpoints Documentados

### ✅ Completados
- **Health**: Verificación de estado del servidor
- **Auth**: Autenticación y gestión de usuarios
  - POST /api/auth/login
  - POST /api/auth/register
  - GET /api/auth/me
  - PUT /api/auth/me
  - PUT /api/auth/change-password
  - POST /api/auth/logout
- **Clients**: Gestión de clientes por entrenadores
  - GET /api/clients
  - GET /api/clients/stats
  - GET /api/clients/{clientId}
  - POST /api/clients/{clientId}/assign
  - DELETE /api/clients/{clientId}/assign

### 🔄 Pendientes
- **Plans**: Gestión de planes de dieta y entrenamiento
- **Progress**: Seguimiento del progreso de usuarios
- **Chat**: Sistema de mensajería
- **Upload**: Gestión de archivos e imágenes

## Esquemas de Datos Documentados

### Usuarios
- `User` - Modelo completo de usuario
- `LoginRequest` - Datos de login
- `LoginResponse` - Respuesta de autenticación
- `RegisterRequest` - Datos de registro
- `UpdateUserRequest` - Datos de actualización
- `ChangePasswordRequest` - Cambio de contraseña

### Planes
- `Food` - Alimentos y sus propiedades nutricionales
- `Meal` - Comidas con alimentos y cantidades
- `DietPlan` - Plan de dieta completo
- `Exercise` - Ejercicios y sus características
- `WorkoutSet` - Series de ejercicios
- `WorkoutExercise` - Ejercicios en entrenamientos
- `Workout` - Entrenamientos individuales
- `WorkoutPlan` - Plan de entrenamiento completo

### Progreso
- `ProgressLog` - Registro completo de progreso
- `ClientStats` - Estadísticas de clientes

### Chat
- `ChatMessage` - Mensajes del sistema de chat

## Características de la Documentación

### Seguridad
- Autenticación JWT Bearer Token
- Autorización por roles (USER/TRAINER)
- Rate limiting documentado
- Validación de datos

### Validaciones
- Esquemas de validación para todos los endpoints
- Restricciones de longitud y formato
- Validación de tipos de datos
- Mensajes de error descriptivos

### Respuestas
- Formato consistente de respuestas
- Códigos de estado HTTP apropiados
- Paginación para listas
- Manejo de errores

### Ejemplos
- Ejemplos de request/response
- Casos de uso comunes
- Datos de prueba realistas

## Cómo Usar la Documentación

### 1. Acceder a la Interfaz Web
```bash
# Iniciar el servidor
npm start

# Abrir en el navegador
http://localhost:5000/api/docs
```

### 2. Autenticarse
1. Usar el endpoint `/api/auth/login` para obtener un token
2. El token se guarda automáticamente en el navegador
3. Los endpoints protegidos usarán el token automáticamente

### 3. Probar Endpoints
1. Expandir la sección del endpoint deseado
2. Hacer clic en "Try it out"
3. Llenar los parámetros requeridos
4. Ejecutar la petición
5. Ver la respuesta en tiempo real

### 4. Generar Código
```bash
# Usar la especificación JSON para generar código
curl http://localhost:5000/api/docs/swagger.json > swagger.json

# Usar con herramientas como:
# - OpenAPI Generator
# - Swagger Codegen
# - Postman (importar JSON)
```

## Completar la Documentación

Para completar los endpoints pendientes, sigue la guía en `SWAGGER_COMPLETION.md`. Los pasos principales son:

1. Agregar endpoints de Plans
2. Agregar endpoints de Progress
3. Agregar endpoints de Chat
4. Agregar endpoints de Upload
5. Agregar esquemas adicionales
6. Validar la especificación

## Validación

### Validar Swagger JSON
```bash
# Usar herramientas online
# https://editor.swagger.io/
# https://apitools.dev/swagger-parser/online/

# O herramientas de línea de comandos
npm install -g swagger-cli
swagger-cli validate swagger.json
```

### Verificar Sintaxis
```bash
# Verificar que el JSON es válido
node -e "console.log(JSON.parse(require('fs').readFileSync('swagger.json', 'utf8')))"
```

## Personalización

### Modificar Estilos
Editar el archivo `src/routes/docs.ts` para cambiar:
- Colores del tema
- Configuración de Swagger UI
- Comportamiento de autenticación
- Interceptores de requests/responses

### Agregar Funcionalidades
- Botones personalizados
- Validaciones adicionales
- Integración con otros servicios
- Métricas de uso

## Troubleshooting

### Error: "No se pudo cargar el archivo swagger.json"
- Verificar que el archivo existe en la raíz del proyecto
- Verificar permisos de lectura
- Verificar sintaxis JSON válida

### Error: "Token JWT inválido"
- Usar el endpoint de login para obtener un nuevo token
- Verificar que el token no haya expirado
- Usar el botón "Limpiar Token" y volver a autenticarse

### Error: "CORS"
- Verificar configuración de CORS en el servidor
- Asegurar que las rutas estén correctamente configuradas

## Contribuir

1. Seguir las convenciones de nomenclatura
2. Documentar todos los parámetros y respuestas
3. Incluir ejemplos relevantes
4. Validar la especificación antes de commit
5. Actualizar este README si es necesario

## Recursos Adicionales

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Tools](https://openapi.tools/)
- [Swagger Editor](https://editor.swagger.io/) 