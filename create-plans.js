// Configuración
const BASE_URL = 'http://localhost:5000/api';
const CLIENT_ID = '68812786d6a07da255dfc97c';
const TRAINER_ID = '68812786d6a07da255dfc973'; // ID del entrenador

// Datos de autenticación del entrenador
const TRAINER_CREDENTIALS = {
  email: 'trainer@example.com',
  password: 'password123'
};

// Plan de Alimentación Personalizado
const dietPlan = {
  title: "Plan de Alimentación Equilibrado - Cliente Ejemplo",
  description: "Plan de alimentación personalizado para mejorar la salud y el bienestar general",
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 200,
  targetFat: 67,
  meals: [
    {
      type: "BREAKFAST",
      foods: [
        {
          food: {
            name: "Avena",
            calories: 389,
            protein: 16.9,
            carbs: 66.3,
            fat: 6.9,
            fiber: 10.6
          },
          quantity: 80
        },
        {
          food: {
            name: "Plátano",
            calories: 89,
            protein: 1.1,
            carbs: 22.8,
            fat: 0.3,
            fiber: 2.6
          },
          quantity: 120
        },
        {
          food: {
            name: "Leche descremada",
            calories: 42,
            protein: 3.4,
            carbs: 5.0,
            fat: 0.1,
            fiber: 0
          },
          quantity: 200
        }
      ],
      totalCalories: 520,
      notes: "Desayuno energético con avena, plátano y leche"
    },
    {
      type: "LUNCH",
      foods: [
        {
          food: {
            name: "Pechuga de pollo",
            calories: 165,
            protein: 31.0,
            carbs: 0,
            fat: 3.6,
            fiber: 0
          },
          quantity: 150
        },
        {
          food: {
            name: "Arroz integral",
            calories: 111,
            protein: 2.6,
            carbs: 23.0,
            fat: 0.9,
            fiber: 1.8
          },
          quantity: 100
        },
        {
          food: {
            name: "Brócoli",
            calories: 34,
            protein: 2.8,
            carbs: 7.0,
            fat: 0.4,
            fiber: 2.6
          },
          quantity: 150
        },
        {
          food: {
            name: "Aceite de oliva",
            calories: 884,
            protein: 0,
            carbs: 0,
            fat: 100,
            fiber: 0
          },
          quantity: 10
        }
      ],
      totalCalories: 650,
      notes: "Almuerzo proteico con pollo, arroz integral y verduras"
    },
    {
      type: "DINNER",
      foods: [
        {
          food: {
            name: "Salmón",
            calories: 208,
            protein: 25.0,
            carbs: 0,
            fat: 12.0,
            fiber: 0
          },
          quantity: 150
        },
        {
          food: {
            name: "Quinoa",
            calories: 120,
            protein: 4.4,
            carbs: 21.3,
            fat: 1.9,
            fiber: 2.8
          },
          quantity: 100
        },
        {
          food: {
            name: "Espinacas",
            calories: 23,
            protein: 2.9,
            carbs: 3.6,
            fat: 0.4,
            fiber: 2.2
          },
          quantity: 100
        },
        {
          food: {
            name: "Aceite de oliva",
            calories: 884,
            protein: 0,
            carbs: 0,
            fat: 100,
            fiber: 0
          },
          quantity: 8
        }
      ],
      totalCalories: 580,
      notes: "Cena ligera con salmón, quinoa y espinacas"
    },
    {
      type: "SNACK",
      foods: [
        {
          food: {
            name: "Yogur griego natural",
            calories: 59,
            protein: 10.0,
            carbs: 3.6,
            fat: 0.4,
            fiber: 0
          },
          quantity: 170
        },
        {
          food: {
            name: "Nueces",
            calories: 654,
            protein: 15.2,
            carbs: 13.7,
            fat: 65.2,
            fiber: 6.7
          },
          quantity: 30
        }
      ],
      totalCalories: 250,
      notes: "Snack saludable con yogur y nueces"
    }
  ],
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
  notes: "Plan personalizado para mejorar la nutrición y el bienestar general"
};

// Plan de Entrenamiento Personalizado
const workoutPlan = {
  title: "Plan de Entrenamiento Iniciación - Cliente Ejemplo",
  description: "Plan de entrenamiento para principiantes enfocado en mejorar la condición física general",
  workouts: [
    {
      name: "Entrenamiento de Fuerza Básico",
      exercises: [
        {
          exercise: {
            name: "Sentadillas",
            type: "STRENGTH",
            description: "Ejercicio fundamental para piernas y glúteos",
            instructions: [
              "Ponte de pie con los pies separados al ancho de los hombros",
              "Baja como si te sentaras en una silla",
              "Mantén el pecho arriba y las rodillas alineadas con los pies",
              "Vuelve a la posición inicial"
            ],
            targetMuscles: ["Cuádriceps", "Glúteos", "Isquiotibiales"],
            equipment: ["Peso corporal"],
            difficulty: "beginner"
          },
          sets: [
            {
              reps: 12,
              restTime: 60
            },
            {
              reps: 12,
              restTime: 60
            },
            {
              reps: 10,
              restTime: 60
            }
          ],
          notes: "Enfócate en la técnica correcta"
        },
        {
          exercise: {
            name: "Flexiones de pecho",
            type: "STRENGTH",
            description: "Ejercicio para pecho, hombros y tríceps",
            instructions: [
              "Colócate en posición de plancha",
              "Baja el cuerpo hasta que el pecho toque el suelo",
              "Empuja hacia arriba hasta la posición inicial"
            ],
            targetMuscles: ["Pecho", "Hombros", "Tríceps"],
            equipment: ["Peso corporal"],
            difficulty: "beginner"
          },
          sets: [
            {
              reps: 8,
              restTime: 60
            },
            {
              reps: 8,
              restTime: 60
            },
            {
              reps: 6,
              restTime: 60
            }
          ],
          notes: "Si es muy difícil, puedes hacerlas de rodillas"
        },
        {
          exercise: {
            name: "Plancha",
            type: "STRENGTH",
            description: "Ejercicio isométrico para core",
            instructions: [
              "Colócate en posición de plancha",
              "Mantén el cuerpo recto de la cabeza a los pies",
              "Aguanta la posición"
            ],
            targetMuscles: ["Core", "Abdominales", "Lumbares"],
            equipment: ["Peso corporal"],
            difficulty: "beginner"
          },
          sets: [
            {
              duration: 30,
              restTime: 60
            },
            {
              duration: 30,
              restTime: 60
            },
            {
              duration: 30,
              restTime: 60
            }
          ],
          notes: "Mantén la respiración constante"
        }
      ],
      estimatedDuration: 45,
      difficulty: "beginner",
      notes: "Entrenamiento básico de fuerza para principiantes"
    },
    {
      name: "Entrenamiento Cardio",
      exercises: [
        {
          exercise: {
            name: "Burpees",
            type: "CARDIO",
            description: "Ejercicio completo que combina fuerza y cardio",
            instructions: [
              "Ponte de pie",
              "Baja a posición de sentadilla",
              "Coloca las manos en el suelo",
              "Salta hacia atrás a posición de plancha",
              "Haz una flexión",
              "Salta hacia adelante",
              "Salta hacia arriba"
            ],
            targetMuscles: ["Todo el cuerpo"],
            equipment: ["Peso corporal"],
            difficulty: "beginner"
          },
          sets: [
            {
              reps: 5,
              restTime: 90
            },
            {
              reps: 5,
              restTime: 90
            },
            {
              reps: 5,
              restTime: 90
            }
          ],
          notes: "Ejercicio intenso, toma descansos si es necesario"
        },
        {
          exercise: {
            name: "Mountain climbers",
            type: "CARDIO",
            description: "Ejercicio dinámico para cardio y core",
            instructions: [
              "Colócate en posición de plancha",
              "Lleva una rodilla hacia el pecho",
              "Alterna rápidamente entre piernas"
            ],
            targetMuscles: ["Core", "Cardio"],
            equipment: ["Peso corporal"],
            difficulty: "beginner"
          },
          sets: [
            {
              duration: 30,
              restTime: 60
            },
            {
              duration: 30,
              restTime: 60
            },
            {
              duration: 30,
              restTime: 60
            }
          ],
          notes: "Mantén el core activo durante todo el ejercicio"
        },
        {
          exercise: {
            name: "Jumping jacks",
            type: "CARDIO",
            description: "Ejercicio clásico de cardio",
            instructions: [
              "Ponte de pie con los brazos a los lados",
              "Salta separando las piernas y levantando los brazos",
              "Vuelve a la posición inicial"
            ],
            targetMuscles: ["Cardio", "Coordinación"],
            equipment: ["Peso corporal"],
            difficulty: "beginner"
          },
          sets: [
            {
              duration: 45,
              restTime: 60
            },
            {
              duration: 45,
              restTime: 60
            },
            {
              duration: 45,
              restTime: 60
            }
          ],
          notes: "Ejercicio de bajo impacto pero efectivo"
        }
      ],
      estimatedDuration: 30,
      difficulty: "beginner",
      notes: "Entrenamiento cardio para mejorar la resistencia"
    },
    {
      name: "Entrenamiento de Flexibilidad",
      exercises: [
        {
          exercise: {
            name: "Estiramiento de isquiotibiales",
            type: "FLEXIBILITY",
            description: "Estiramiento para la parte posterior de las piernas",
            instructions: [
              "Siéntate en el suelo con las piernas extendidas",
              "Inclínate hacia adelante desde las caderas",
              "Mantén la posición por 30 segundos"
            ],
            targetMuscles: ["Isquiotibiales"],
            equipment: ["Ninguno"],
            difficulty: "beginner"
          },
          sets: [
            {
              duration: 30,
              restTime: 30
            },
            {
              duration: 30,
              restTime: 30
            }
          ],
          notes: "No rebotes, mantén el estiramiento suave"
        },
        {
          exercise: {
            name: "Estiramiento de cuádriceps",
            type: "FLEXIBILITY",
            description: "Estiramiento para la parte frontal de las piernas",
            instructions: [
              "De pie, dobla una rodilla hacia atrás",
              "Agarra el pie con la mano del mismo lado",
              "Mantén la posición por 30 segundos"
            ],
            targetMuscles: ["Cuádriceps"],
            equipment: ["Ninguno"],
            difficulty: "beginner"
          },
          sets: [
            {
              duration: 30,
              restTime: 30
            },
            {
              duration: 30,
              restTime: 30
            }
          ],
          notes: "Mantén la rodilla alineada con la cadera"
        },
        {
          exercise: {
            name: "Estiramiento de hombros",
            type: "FLEXIBILITY",
            description: "Estiramiento para mejorar la movilidad de hombros",
            instructions: [
              "Lleva un brazo hacia el pecho",
              "Usa el otro brazo para presionar suavemente",
              "Mantén la posición por 30 segundos"
            ],
            targetMuscles: ["Hombros", "Pecho"],
            equipment: ["Ninguno"],
            difficulty: "beginner"
          },
          sets: [
            {
              duration: 30,
              restTime: 30
            },
            {
              duration: 30,
              restTime: 30
            }
          ],
          notes: "Estiramiento suave para mejorar la movilidad"
        }
      ],
      estimatedDuration: 20,
      difficulty: "beginner",
      notes: "Sesión de flexibilidad para recuperación y movilidad"
    }
  ],
  schedule: [
    { dayOfWeek: 1, workoutIndex: 0 }, // Lunes - Fuerza
    { dayOfWeek: 3, workoutIndex: 1 }, // Miércoles - Cardio
    { dayOfWeek: 5, workoutIndex: 0 }, // Viernes - Fuerza
    { dayOfWeek: 6, workoutIndex: 2 }  // Sábado - Flexibilidad
  ],
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
  notes: "Plan de iniciación para mejorar la condición física general"
};

async function createPlans() {
  try {
    console.log('🚀 Iniciando creación de planes para el cliente...');
    
    // 1. Autenticar como entrenador
    console.log('🔐 Autenticando como entrenador...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TRAINER_CREDENTIALS)
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Error de autenticación: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Asignar cliente al entrenador
    console.log('👥 Asignando cliente al entrenador...');
    const assignResponse = await fetch(`${BASE_URL}/clients/${CLIENT_ID}/assign`, {
      method: 'POST',
      headers
    });
    
    if (!assignResponse.ok) {
      const errorData = await assignResponse.json();
      console.log('⚠️ Cliente ya asignado o error de asignación:', errorData.message);
    } else {
      const assignData = await assignResponse.json();
      console.log('✅ Cliente asignado:', assignData.message);
    }
    
    // 3. Crear plan de dieta
    console.log('🍽️ Creando plan de alimentación...');
    const dietResponse = await fetch(`${BASE_URL}/plans/${CLIENT_ID}/diet`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(dietPlan)
    });
    
    if (!dietResponse.ok) {
      const errorData = await dietResponse.json();
      throw new Error(`Error al crear plan de dieta: ${JSON.stringify(errorData)}`);
    }
    
    const dietData = await dietResponse.json();
    console.log('✅ Plan de alimentación creado:', dietData.message);
    
    // 4. Crear plan de entrenamiento
    console.log('💪 Creando plan de entrenamiento...');
    const workoutResponse = await fetch(`${BASE_URL}/plans/${CLIENT_ID}/workout`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(workoutPlan)
    });
    
    if (!workoutResponse.ok) {
      const errorData = await workoutResponse.json();
      throw new Error(`Error al crear plan de entrenamiento: ${JSON.stringify(errorData)}`);
    }
    
    const workoutData = await workoutResponse.json();
    console.log('✅ Plan de entrenamiento creado:', workoutData.message);
    
    // 5. Verificar los planes creados
    console.log('📋 Verificando planes creados...');
    
    const dietCheck = await fetch(`${BASE_URL}/plans/${CLIENT_ID}/diet`, { headers });
    const dietCheckData = await dietCheck.json();
    console.log('📊 Plan de dieta:', dietCheckData.data.title);
    
    const workoutCheck = await fetch(`${BASE_URL}/plans/${CLIENT_ID}/workout`, { headers });
    const workoutCheckData = await workoutCheck.json();
    console.log('🏋️ Plan de entrenamiento:', workoutCheckData.data.title);
    
    console.log('\n🎉 ¡Planes creados exitosamente!');
    console.log('📧 Cliente:', 'client@example.com');
    console.log('🆔 ID del cliente:', CLIENT_ID);
    console.log('👨‍💼 Entrenador:', 'trainer@example.com');
    
    console.log('\n📋 Resumen de planes creados:');
    console.log('🍽️ Plan de Alimentación:');
    console.log(`   - Título: ${dietPlan.title}`);
    console.log(`   - Calorías objetivo: ${dietPlan.targetCalories}`);
    console.log(`   - Proteína objetivo: ${dietPlan.targetProtein}g`);
    console.log(`   - Comidas: ${dietPlan.meals.length} (Desayuno, Almuerzo, Cena, Snack)`);
    
    console.log('\n💪 Plan de Entrenamiento:');
    console.log(`   - Título: ${workoutPlan.title}`);
    console.log(`   - Entrenamientos: ${workoutPlan.workouts.length}`);
    console.log(`   - Días por semana: ${workoutPlan.schedule.length}`);
    console.log(`   - Duración: 30 días`);
    
  } catch (error) {
    console.error('❌ Error al crear los planes:', error.message);
  }
}

// Ejecutar el script
createPlans(); 