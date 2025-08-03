# Categorías de Entrenamiento

## Descripción General

El sistema de planes de entrenamiento ahora soporta una categorización más específica que permite dividir los entrenamientos en diferentes tipos según el objetivo y la zona del cuerpo trabajada.

## Categorías Disponibles

### 1. CARDIO
- **Descripción**: Entrenamientos enfocados en mejorar la resistencia cardiovascular
- **Ejemplos**: Correr, ciclismo, HIIT, burpees, jumping jacks
- **Objetivo**: Mejorar la capacidad aeróbica y quemar calorías

### 2. STRENGTH_UPPER_1 (Tren Superior 1)
- **Descripción**: Entrenamiento de fuerza para la parte superior del cuerpo - Primera sesión
- **Músculos principales**: Pecho, hombros, tríceps
- **Ejemplos**: Press de banca, flexiones, press militar
- **Objetivo**: Desarrollar fuerza en la parte superior del cuerpo

### 3. STRENGTH_UPPER_2 (Tren Superior 2)
- **Descripción**: Entrenamiento de fuerza para la parte superior del cuerpo - Segunda sesión
- **Músculos principales**: Espalda, bíceps, antebrazos
- **Ejemplos**: Dominadas, remo, curl de bíceps
- **Objetivo**: Desarrollar fuerza en la parte posterior y brazos

### 4. STRENGTH_LOWER_1 (Tren Inferior 1)
- **Descripción**: Entrenamiento de fuerza para la parte inferior del cuerpo - Primera sesión
- **Músculos principales**: Cuádriceps, glúteos
- **Ejemplos**: Sentadillas, press de piernas, extensiones
- **Objetivo**: Desarrollar fuerza en las piernas

### 5. STRENGTH_LOWER_2 (Tren Inferior 2)
- **Descripción**: Entrenamiento de fuerza para la parte inferior del cuerpo - Segunda sesión
- **Músculos principales**: Isquiotibiales, pantorrillas, core
- **Ejemplos**: Peso muerto, curl de piernas, planchas
- **Objetivo**: Desarrollar fuerza en la parte posterior de las piernas y core

### 6. FLEXIBILITY
- **Descripción**: Entrenamientos enfocados en mejorar la movilidad y flexibilidad
- **Ejemplos**: Estiramientos, yoga, movilidad articular
- **Objetivo**: Mejorar la flexibilidad y prevenir lesiones

## Estructura del Modelo

### WorkoutCategory Enum
```typescript
export enum WorkoutCategory {
  CARDIO = 'CARDIO',
  STRENGTH_UPPER_1 = 'STRENGTH_UPPER_1',
  STRENGTH_UPPER_2 = 'STRENGTH_UPPER_2',
  STRENGTH_LOWER_1 = 'STRENGTH_LOWER_1',
  STRENGTH_LOWER_2 = 'STRENGTH_LOWER_2',
  FLEXIBILITY = 'FLEXIBILITY'
}
```

### MuscleGroup Enum
```typescript
export enum MuscleGroup {
  CHEST = 'CHEST',
  BACK = 'BACK',
  SHOULDERS = 'SHOULDERS',
  BICEPS = 'BICEPS',
  TRICEPS = 'TRICEPS',
  FOREARMS = 'FOREARMS',
  QUADRICEPS = 'QUADRICEPS',
  HAMSTRINGS = 'HAMSTRINGS',
  GLUTES = 'GLUTES',
  CALVES = 'CALVES',
  CORE = 'CORE',
  CARDIO = 'CARDIO',
  FULL_BODY = 'FULL_BODY'
}
```

## Ejemplo de Uso

### Crear un Plan de Entrenamiento con Categorías

```typescript
const workoutPlan = {
  title: "Plan de Entrenamiento Avanzado",
  workouts: [
    {
      name: "Cardio HIIT",
      category: "CARDIO",
      exercises: [...],
      estimatedDuration: 30,
      difficulty: "intermediate"
    },
    {
      name: "Tren Superior - Pecho y Hombros",
      category: "STRENGTH_UPPER_1",
      exercises: [...],
      estimatedDuration: 45,
      difficulty: "intermediate"
    },
    {
      name: "Tren Superior - Espalda y Bíceps",
      category: "STRENGTH_UPPER_2",
      exercises: [...],
      estimatedDuration: 45,
      difficulty: "intermediate"
    },
    {
      name: "Tren Inferior - Cuádriceps",
      category: "STRENGTH_LOWER_1",
      exercises: [...],
      estimatedDuration: 40,
      difficulty: "intermediate"
    },
    {
      name: "Tren Inferior - Isquiotibiales y Core",
      category: "STRENGTH_LOWER_2",
      exercises: [...],
      estimatedDuration: 40,
      difficulty: "intermediate"
    },
    {
      name: "Flexibilidad y Movilidad",
      category: "FLEXIBILITY",
      exercises: [...],
      estimatedDuration: 20,
      difficulty: "beginner"
    }
  ],
  schedule: [
    { dayOfWeek: 1, workoutIndex: 1 }, // Lunes - Tren Superior 1
    { dayOfWeek: 2, workoutIndex: 0 }, // Martes - Cardio
    { dayOfWeek: 3, workoutIndex: 2 }, // Miércoles - Tren Superior 2
    { dayOfWeek: 4, workoutIndex: 3 }, // Jueves - Tren Inferior 1
    { dayOfWeek: 5, workoutIndex: 0 }, // Viernes - Cardio
    { dayOfWeek: 6, workoutIndex: 4 }, // Sábado - Tren Inferior 2
    { dayOfWeek: 0, workoutIndex: 5 }  // Domingo - Flexibilidad
  ]
};
```

## Métodos Útiles del Modelo

### Obtener Entrenamientos por Categoría
```typescript
// Obtener todos los entrenamientos de fuerza
const strengthWorkouts = workoutPlan.getStrengthWorkouts();

// Obtener entrenamientos de cardio
const cardioWorkouts = workoutPlan.getCardioWorkouts();

// Obtener entrenamientos de flexibilidad
const flexibilityWorkouts = workoutPlan.getFlexibilityWorkouts();

// Obtener entrenamientos de una categoría específica
const upperBodyWorkouts = workoutPlan.getWorkoutsByCategory('STRENGTH_UPPER_1');
```

### Propiedades Virtuales
```typescript
// Contar entrenamientos por tipo
const strengthCount = workoutPlan.strengthWorkoutsCount;
const cardioCount = workoutPlan.cardioWorkoutsCount;
const flexibilityCount = workoutPlan.flexibilityWorkoutsCount;

// Obtener todas las categorías del plan
const categories = workoutPlan.workoutCategories;
```

## Ventajas de esta Estructura

1. **Especificidad**: Permite crear entrenamientos muy específicos para diferentes zonas del cuerpo
2. **Flexibilidad**: Permite múltiples sesiones de fuerza por semana sin sobrecargar los mismos músculos
3. **Organización**: Facilita la planificación semanal con diferentes tipos de entrenamiento
4. **Escalabilidad**: Fácil agregar nuevas categorías en el futuro
5. **Análisis**: Permite análisis detallados del balance de entrenamientos

## Recomendaciones de Uso

### Para Principiantes
- 2-3 sesiones de fuerza por semana
- 2-3 sesiones de cardio por semana
- 1-2 sesiones de flexibilidad por semana

### Para Intermedios
- 4-5 sesiones de fuerza por semana (divididas en tren superior e inferior)
- 2-3 sesiones de cardio por semana
- 1-2 sesiones de flexibilidad por semana

### Para Avanzados
- 5-6 sesiones de fuerza por semana (especialización por grupos musculares)
- 2-4 sesiones de cardio por semana
- 1-3 sesiones de flexibilidad por semana 