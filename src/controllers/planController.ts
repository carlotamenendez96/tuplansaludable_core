import { Request, Response } from 'express';
import { DietPlan } from '../models/DietPlan';
import { WorkoutPlan } from '../models/WorkoutPlan';
import { User } from '../models/User';
import { UserRole, IUpdateDietPlanRequest, IUpdateWorkoutPlanRequest, IUser } from '../types';

/**
 * Obtener plan de dieta de un usuario
 */
export const getDietPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { userId } = req.params;

    // Buscar plan de dieta activo
    const dietPlan = await DietPlan.findOne({ 
      userId, 
      isActive: true 
    })
    .populate('userId', 'firstName lastName email profilePicture')
    .populate('trainerId', 'firstName lastName email profilePicture')
    .lean();

    if (!dietPlan) {
      res.status(404).json({
        success: false,
        message: 'No se encontró un plan de dieta activo para este usuario',
        error: 'DIET_PLAN_NOT_FOUND'
      });
      return;
    }

    // Calcular macros actuales y distribución
    let actualMacros = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };

    dietPlan.meals.forEach(meal => {
      meal.foods.forEach(foodItem => {
        const multiplier = foodItem.quantity / 100;
        actualMacros.calories += foodItem.food.calories * multiplier;
        actualMacros.protein += foodItem.food.protein * multiplier;
        actualMacros.carbs += foodItem.food.carbs * multiplier;
        actualMacros.fat += foodItem.food.fat * multiplier;
        actualMacros.fiber += (foodItem.food.fiber || 0) * multiplier;
      });
    });

    // Redondear valores
    actualMacros = {
      calories: Math.round(actualMacros.calories),
      protein: Math.round(actualMacros.protein * 10) / 10,
      carbs: Math.round(actualMacros.carbs * 10) / 10,
      fat: Math.round(actualMacros.fat * 10) / 10,
      fiber: Math.round(actualMacros.fiber * 10) / 10
    };

    // Calcular distribución de macros en porcentajes
    const macroDistribution = {
      protein: actualMacros.calories > 0 ? Math.round((actualMacros.protein * 4 / actualMacros.calories) * 100) : 0,
      carbs: actualMacros.calories > 0 ? Math.round((actualMacros.carbs * 4 / actualMacros.calories) * 100) : 0,
      fat: actualMacros.calories > 0 ? Math.round((actualMacros.fat * 9 / actualMacros.calories) * 100) : 0
    };

    // Calcular duración del plan
    const durationDays = dietPlan.endDate ? 
      Math.ceil((dietPlan.endDate.getTime() - dietPlan.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 
      null;

    const response = {
      ...dietPlan,
      actualMacros,
      macroDistribution,
      durationDays,
      isCurrent: (() => {
        const now = new Date();
        const isAfterStart = now >= dietPlan.startDate;
        const isBeforeEnd = !dietPlan.endDate || now <= dietPlan.endDate;
        return dietPlan.isActive && isAfterStart && isBeforeEnd;
      })()
    };

    res.status(200).json({
      success: true,
      message: 'Plan de dieta obtenido exitosamente',
      data: response
    });

  } catch (error) {
    console.error('Error en getDietPlan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Crear o actualizar plan de dieta de un usuario
 */
export const updateDietPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { userId } = req.params;
    const planData: IUpdateDietPlanRequest = req.body;

    // Solo entrenadores pueden crear/actualizar planes
    if (req.user.role !== UserRole.TRAINER) {
      res.status(403).json({
        success: false,
        message: 'Solo los entrenadores pueden crear o actualizar planes de dieta',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Verificar que el cliente pertenece al entrenador
    if (user.trainerId?.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear planes para este usuario',
        error: 'NOT_YOUR_CLIENT'
      });
      return;
    }

    // Desactivar plan anterior si existe
    await DietPlan.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Crear nuevo plan
    const newDietPlan = new DietPlan({
      userId,
      trainerId: req.user.id,
      ...planData
    });

    await newDietPlan.save();

    // Poblar referencias
    await newDietPlan.populate([
      { path: 'userId', select: 'firstName lastName email profilePicture' },
      { path: 'trainerId', select: 'firstName lastName email profilePicture' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Plan de dieta creado exitosamente',
      data: newDietPlan
    });

  } catch (error) {
    console.error('Error en updateDietPlan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Obtener plan de entrenamiento de un usuario
 */
export const getWorkoutPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { userId } = req.params;

    // Buscar plan de entrenamiento activo
    const workoutPlan = await WorkoutPlan.findOne({ 
      userId, 
      isActive: true 
    })
    .populate('userId', 'firstName lastName email profilePicture')
    .populate('trainerId', 'firstName lastName email profilePicture')
    .lean();

    if (!workoutPlan) {
      res.status(404).json({
        success: false,
        message: 'No se encontró un plan de entrenamiento activo para este usuario',
        error: 'WORKOUT_PLAN_NOT_FOUND'
      });
      return;
    }

    // Calcular estadísticas del plan
    const weeklyWorkouts = workoutPlan.schedule.length;
    const totalExercises = workoutPlan.workouts.reduce((total, workout) => total + workout.exercises.length, 0);
    const averageWorkoutDuration = workoutPlan.workouts.length > 0 ? 
      Math.round(workoutPlan.workouts.reduce((total, workout) => total + workout.estimatedDuration, 0) / workoutPlan.workouts.length) : 
      0;

    // Obtener grupos musculares objetivo
    const targetedMuscleGroups = new Set<string>();
    workoutPlan.workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.exercise.targetMuscles.forEach(muscle => {
          targetedMuscleGroups.add(muscle.toLowerCase());
        });
      });
    });

    // Calcular duración del plan
    const durationDays = workoutPlan.endDate ? 
      Math.ceil((workoutPlan.endDate.getTime() - workoutPlan.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 
      null;

    // Obtener entrenamiento de hoy
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todaysSchedule = workoutPlan.schedule.find(item => item.dayOfWeek === today);
    const todaysWorkout = todaysSchedule && todaysSchedule.workoutIndex < workoutPlan.workouts.length ? 
      workoutPlan.workouts[todaysSchedule.workoutIndex] : 
      null;

    // Calcular duración semanal total
    const weeklyDuration = workoutPlan.schedule.reduce((total, scheduleItem) => {
      const workout = workoutPlan.workouts[scheduleItem.workoutIndex];
      return total + (workout ? workout.estimatedDuration : 0);
    }, 0);

    const response = {
      ...workoutPlan,
      weeklyWorkouts,
      totalExercises,
      averageWorkoutDuration,
      targetedMuscleGroups: Array.from(targetedMuscleGroups),
      durationDays,
      weeklyDuration,
      todaysWorkout,
      isCurrent: (() => {
        const now = new Date();
        const isAfterStart = now >= workoutPlan.startDate;
        const isBeforeEnd = !workoutPlan.endDate || now <= workoutPlan.endDate;
        return workoutPlan.isActive && isAfterStart && isBeforeEnd;
      })()
    };

    res.status(200).json({
      success: true,
      message: 'Plan de entrenamiento obtenido exitosamente',
      data: response
    });

  } catch (error) {
    console.error('Error en getWorkoutPlan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Crear o actualizar plan de entrenamiento de un usuario
 */
export const updateWorkoutPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { userId } = req.params;
    const planData: IUpdateWorkoutPlanRequest = req.body;

    // Solo entrenadores pueden crear/actualizar planes
    if (req.user.role !== UserRole.TRAINER) {
      res.status(403).json({
        success: false,
        message: 'Solo los entrenadores pueden crear o actualizar planes de entrenamiento',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Verificar que el cliente pertenece al entrenador
    if (user.trainerId?.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear planes para este usuario',
        error: 'NOT_YOUR_CLIENT'
      });
      return;
    }

    // Validar que los índices de workout en schedule sean válidos
    if (planData.schedule && planData.workouts) {
      const maxWorkoutIndex = planData.workouts.length - 1;
      const invalidSchedule = planData.schedule.find(item => item.workoutIndex > maxWorkoutIndex);
      
      if (invalidSchedule) {
        res.status(400).json({
          success: false,
          message: `Índice de entrenamiento inválido: ${invalidSchedule.workoutIndex}. Máximo permitido: ${maxWorkoutIndex}`,
          error: 'INVALID_WORKOUT_INDEX'
        });
        return;
      }
    }

    // Desactivar plan anterior si existe
    await WorkoutPlan.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Crear nuevo plan
    const newWorkoutPlan = new WorkoutPlan({
      userId,
      trainerId: req.user.id,
      ...planData
    });

    await newWorkoutPlan.save();

    // Poblar referencias
    await newWorkoutPlan.populate([
      { path: 'userId', select: 'firstName lastName email profilePicture' },
      { path: 'trainerId', select: 'firstName lastName email profilePicture' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Plan de entrenamiento creado exitosamente',
      data: newWorkoutPlan
    });

  } catch (error) {
    console.error('Error en updateWorkoutPlan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Obtener historial de planes de un usuario
 */
export const getPlansHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { userId } = req.params;
    const { type, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let dietPlansHistory: any[] = [];
    let workoutPlansHistory: any[] = [];
    let totalDietPlans = 0;
    let totalWorkoutPlans = 0;

    if (!type || type === 'diet') {
      [dietPlansHistory, totalDietPlans] = await Promise.all([
        DietPlan.find({ userId })
          .populate('trainerId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        DietPlan.countDocuments({ userId })
      ]);
    }

    if (!type || type === 'workout') {
      [workoutPlansHistory, totalWorkoutPlans] = await Promise.all([
        WorkoutPlan.find({ userId })
          .populate('trainerId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        WorkoutPlan.countDocuments({ userId })
      ]);
    }

    const response = {
      dietPlans: {
        data: dietPlansHistory as any[],
        total: totalDietPlans,
        page: Number(page),
        pages: Math.ceil(totalDietPlans / Number(limit))
      },
      workoutPlans: {
        data: workoutPlansHistory as any[],
        total: totalWorkoutPlans,
        page: Number(page),
        pages: Math.ceil(totalWorkoutPlans / Number(limit))
      }
    };

    res.status(200).json({
      success: true,
      message: 'Historial de planes obtenido exitosamente',
      data: response
    });

  } catch (error) {
    console.error('Error en getPlansHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Desactivar un plan específico
 */
export const deactivatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { userId } = req.params;
    const { type } = req.body; // 'diet' or 'workout'

    // Solo entrenadores pueden desactivar planes
    if (req.user.role !== UserRole.TRAINER) {
      res.status(403).json({
        success: false,
        message: 'Solo los entrenadores pueden desactivar planes',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    let result;
    if (type === 'diet') {
      result = await DietPlan.updateMany(
        { userId, trainerId: req.user.id, isActive: true },
        { isActive: false }
      );
    } else if (type === 'workout') {
      result = await WorkoutPlan.updateMany(
        { userId, trainerId: req.user.id, isActive: true },
        { isActive: false }
      );
    } else {
      res.status(400).json({
        success: false,
        message: 'Tipo de plan inválido. Use "diet" o "workout"',
        error: 'INVALID_PLAN_TYPE'
      });
      return;
    }

    if (result.modifiedCount === 0) {
      res.status(404).json({
        success: false,
        message: `No se encontraron planes de ${type === 'diet' ? 'dieta' : 'entrenamiento'} activos para desactivar`,
        error: 'NO_ACTIVE_PLANS'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Plan de ${type === 'diet' ? 'dieta' : 'entrenamiento'} desactivado exitosamente`,
      data: {
        type,
        deactivatedPlans: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error en deactivatePlan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

