import { Router } from 'express';
import {
  getDietPlan,
  updateDietPlan,
  getWorkoutPlan,
  updateWorkoutPlan,
  getPlansHistory,
  deactivatePlan
} from '../controllers/planController';
import { authenticate, authorizeTrainerAccess } from '../middleware/auth';
import { 
  validate, 
  validateParams, 
  validateQuery,
  userIdSchema, 
  dietPlanSchema, 
  workoutPlanSchema 
} from '../middleware/validation';
import Joi from 'joi';

const router = Router();

/**
 * @route   GET /api/plans/:userId/diet
 * @desc    Obtener plan de dieta activo de un usuario
 * @access  Private (Usuario o su entrenador)
 */
router.get('/:userId/diet',
  authenticate,
  validateParams(userIdSchema),
  authorizeTrainerAccess,
  getDietPlan
);

/**
 * @route   PUT /api/plans/:userId/diet
 * @desc    Crear o actualizar plan de dieta de un usuario
 * @access  Private (Solo entrenador del usuario)
 */
router.put('/:userId/diet',
  authenticate,
  validateParams(userIdSchema),
  validate(dietPlanSchema),
  authorizeTrainerAccess,
  updateDietPlan
);

/**
 * @route   GET /api/plans/:userId/workout
 * @desc    Obtener plan de entrenamiento activo de un usuario
 * @access  Private (Usuario o su entrenador)
 */
router.get('/:userId/workout',
  authenticate,
  validateParams(userIdSchema),
  authorizeTrainerAccess,
  getWorkoutPlan
);

/**
 * @route   PUT /api/plans/:userId/workout
 * @desc    Crear o actualizar plan de entrenamiento de un usuario
 * @access  Private (Solo entrenador del usuario)
 */
router.put('/:userId/workout',
  authenticate,
  validateParams(userIdSchema),
  validate(workoutPlanSchema),
  authorizeTrainerAccess,
  updateWorkoutPlan
);

/**
 * @route   GET /api/plans/:userId/history
 * @desc    Obtener historial de planes de un usuario
 * @access  Private (Usuario o su entrenador)
 */
const historyQuerySchema = Joi.object({
  type: Joi.string().valid('diet', 'workout').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

router.get('/:userId/history',
  authenticate,
  validateParams(userIdSchema),
  validateQuery(historyQuerySchema),
  authorizeTrainerAccess,
  getPlansHistory
);

/**
 * @route   POST /api/plans/:userId/deactivate
 * @desc    Desactivar plan activo de un usuario
 * @access  Private (Solo entrenador del usuario)
 */
const deactivatePlanSchema = Joi.object({
  type: Joi.string().valid('diet', 'workout').required().messages({
    'any.required': 'El tipo de plan es requerido',
    'any.only': 'El tipo debe ser "diet" o "workout"'
  })
});

router.post('/:userId/deactivate',
  authenticate,
  validateParams(userIdSchema),
  validate(deactivatePlanSchema),
  authorizeTrainerAccess,
  deactivatePlan
);

export default router;

