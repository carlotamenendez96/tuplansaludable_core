import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { UserRole, ActivityLevel, Goal, MealType, ExerciseType } from '../types';

/**
 * Middleware genérico para validar datos usando Joi
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors
      });
      return;
    }

    req.body = value;
    next();
  };
};

/**
 * Middleware para validar parámetros de URL
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      res.status(400).json({
        success: false,
        message: 'Parámetros de URL inválidos',
        errors
      });
      return;
    }

    req.params = value;
    next();
  };
};

/**
 * Middleware para validar query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      res.status(400).json({
        success: false,
        message: 'Parámetros de consulta inválidos',
        errors
      });
      return;
    }

    req.query = value;
    next();
  };
};

// Esquemas de validación comunes

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    })
});

export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
  password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'string.pattern.base': 'La contraseña debe contener al menos una minúscula, una mayúscula y un número',
      'any.required': 'La contraseña es requerida'
    }),
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 50 caracteres',
      'any.required': 'El nombre es requerido'
    }),
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'El apellido debe tener al menos 2 caracteres',
      'string.max': 'El apellido no puede exceder 50 caracteres',
      'any.required': 'El apellido es requerido'
    }),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .default(UserRole.USER),
  dateOfBirth: Joi.date()
    .max('now')
    .optional(),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .optional(),
  height: Joi.number()
    .min(50)
    .max(300)
    .optional(),
  weight: Joi.number()
    .min(20)
    .max(500)
    .optional(),
  activityLevel: Joi.string()
    .valid(...Object.values(ActivityLevel))
    .optional(),
  goals: Joi.array()
    .items(Joi.string().valid(...Object.values(Goal)))
    .optional(),
  medicalConditions: Joi.array()
    .items(Joi.string().trim())
    .optional(),
  allergies: Joi.array()
    .items(Joi.string().trim())
    .optional(),
  trainerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'ID de entrenador inválido'
    })
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),
  dateOfBirth: Joi.date()
    .max('now')
    .optional(),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .optional(),
  height: Joi.number()
    .min(50)
    .max(300)
    .optional(),
  weight: Joi.number()
    .min(20)
    .max(500)
    .optional(),
  activityLevel: Joi.string()
    .valid(...Object.values(ActivityLevel))
    .optional(),
  goals: Joi.array()
    .items(Joi.string().valid(...Object.values(Goal)))
    .optional(),
  medicalConditions: Joi.array()
    .items(Joi.string().trim())
    .optional(),
  allergies: Joi.array()
    .items(Joi.string().trim())
    .optional()
});

export const objectIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID inválido',
      'any.required': 'ID es requerido'
    })
});

export const userIdSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID de usuario inválido',
      'any.required': 'ID de usuario es requerido'
    })
});

export const partnerIdSchema = Joi.object({
  partnerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID de partner inválido',
      'any.required': 'ID de partner es requerido'
    })
});

export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),
  sort: Joi.string()
    .valid('createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name')
    .default('-createdAt')
});

// Esquemas para planes de dieta
const foodSchema = Joi.object({
  name: Joi.string().trim().required(),
  calories: Joi.number().min(0).required(),
  protein: Joi.number().min(0).required(),
  carbs: Joi.number().min(0).required(),
  fat: Joi.number().min(0).required(),
  fiber: Joi.number().min(0).optional()
});

const mealSchema = Joi.object({
  type: Joi.string().valid(...Object.values(MealType)).required(),
  foods: Joi.array().items(Joi.object({
    food: foodSchema.required(),
    quantity: Joi.number().min(1).required()
  })).min(1).required(),
  notes: Joi.string().trim().max(500).optional()
});

export const dietPlanSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(1000).optional(),
  targetCalories: Joi.number().min(800).max(5000).required(),
  targetProtein: Joi.number().min(0).required(),
  targetCarbs: Joi.number().min(0).required(),
  targetFat: Joi.number().min(0).required(),
  meals: Joi.array().items(mealSchema).optional(),
  startDate: Joi.date().default(() => new Date()),
  endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
  notes: Joi.string().trim().max(1000).optional()
});

// Esquemas para planes de entrenamiento
const exerciseSchema = Joi.object({
  name: Joi.string().trim().required(),
  type: Joi.string().valid(...Object.values(ExerciseType)).required(),
  description: Joi.string().trim().max(500).optional(),
  instructions: Joi.array().items(Joi.string().trim()).optional(),
  targetMuscles: Joi.array().items(Joi.string().trim()).min(1).required(),
  equipment: Joi.array().items(Joi.string().trim()).optional(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner')
});

const workoutSetSchema = Joi.object({
  reps: Joi.number().min(1).optional(),
  weight: Joi.number().min(0).optional(),
  duration: Joi.number().min(1).optional(),
  distance: Joi.number().min(1).optional(),
  restTime: Joi.number().min(0).default(60)
});

const workoutExerciseSchema = Joi.object({
  exercise: exerciseSchema.required(),
  sets: Joi.array().items(workoutSetSchema).min(1).required(),
  notes: Joi.string().trim().max(300).optional()
});

const workoutSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  exercises: Joi.array().items(workoutExerciseSchema).min(1).required(),
  estimatedDuration: Joi.number().min(5).max(300).required(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
  notes: Joi.string().trim().max(500).optional()
});

export const workoutPlanSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(1000).optional(),
  workouts: Joi.array().items(workoutSchema).min(1).required(),
  schedule: Joi.array().items(Joi.object({
    dayOfWeek: Joi.number().min(0).max(6).required(),
    workoutIndex: Joi.number().min(0).required()
  })).optional(),
  startDate: Joi.date().default(() => new Date()),
  endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
  notes: Joi.string().trim().max(1000).optional()
});

// Esquemas para registros de progreso
export const progressLogSchema = Joi.object({
  date: Joi.date().max('now').default(() => new Date()),
  weight: Joi.number().min(20).max(500).optional(),
  bodyFat: Joi.number().min(1).max(60).optional(),
  muscleMass: Joi.number().min(10).max(200).optional(),
  measurements: Joi.object({
    chest: Joi.number().min(50).max(200).optional(),
    waist: Joi.number().min(40).max(200).optional(),
    hips: Joi.number().min(50).max(200).optional(),
    arms: Joi.number().min(15).max(80).optional(),
    thighs: Joi.number().min(30).max(100).optional(),
    neck: Joi.number().min(25).max(60).optional()
  }).optional(),
  mood: Joi.number().min(1).max(10).optional(),
  energyLevel: Joi.number().min(1).max(10).optional(),
  sleepHours: Joi.number().min(0).max(24).optional(),
  waterIntake: Joi.number().min(0).max(10).optional(),
  notes: Joi.string().trim().max(1000).optional(),
  workoutCompleted: Joi.object({
    workoutId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    duration: Joi.number().min(1).max(600).required(),
    caloriesBurned: Joi.number().min(0).max(3000).optional(),
    exercises: Joi.array().items(Joi.object({
      exerciseName: Joi.string().trim().required(),
      setsCompleted: Joi.number().min(0).max(50).required(),
      notes: Joi.string().trim().max(200).optional()
    })).optional()
  }).optional(),
  nutritionLog: Joi.object({
    mealsLogged: Joi.number().min(0).max(10).required(),
    totalCalories: Joi.number().min(0).max(10000).required(),
    totalProtein: Joi.number().min(0).max(500).required(),
    totalCarbs: Joi.number().min(0).max(1000).required(),
    totalFat: Joi.number().min(0).max(300).required()
  }).optional()
});

// Esquemas para chat
export const sendMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(2000).required(),
  messageType: Joi.string().valid('text', 'image', 'file').default('text'),
  attachments: Joi.array().items(Joi.string().uri()).optional()
});

