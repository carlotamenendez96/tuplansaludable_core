import { Router } from 'express';
import {
  getProgressLogs,
  createProgressLog,
  updateProgressLog,
  deleteProgressLog,
  getProgressSummary,
  getProgressStats
} from '../controllers/progressController';
import { authenticate, authorizeTrainerAccess } from '../middleware/auth';
import { 
  validate, 
  validateParams, 
  validateQuery,
  userIdSchema, 
  progressLogSchema,
  objectIdSchema
} from '../middleware/validation';
import { uploadLimiter } from '../middleware/security';
import Joi from 'joi';

const router = Router();

// Esquema para validar query parameters de progreso
const progressQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  sortBy: Joi.string().valid('date', 'weight', 'bodyFat', 'mood', 'energyLevel', 'createdAt').default('date'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Esquema para validar parámetros de resumen
const summaryQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30)
});

// Esquema para validar parámetros de estadísticas
const statsQuerySchema = Joi.object({
  period: Joi.string().valid('week', 'month', 'year').default('week')
});

// Esquema para validar logId
const logIdSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID de usuario inválido',
      'any.required': 'ID de usuario es requerido'
    }),
  logId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID de registro inválido',
      'any.required': 'ID de registro es requerido'
    })
});

/**
 * @route   GET /api/progress/:userId
 * @desc    Obtener registros de progreso de un usuario
 * @access  Private (Usuario o su entrenador)
 */
router.get('/:userId',
  authenticate,
  validateParams(userIdSchema),
  validateQuery(progressQuerySchema),
  authorizeTrainerAccess,
  getProgressLogs
);

/**
 * @route   POST /api/progress/:userId
 * @desc    Crear nuevo registro de progreso
 * @access  Private (Usuario o su entrenador)
 */
router.post('/:userId',
  authenticate,
  uploadLimiter, // Rate limiting para subidas
  validateParams(userIdSchema),
  validate(progressLogSchema),
  authorizeTrainerAccess,
  createProgressLog
);

/**
 * @route   PUT /api/progress/:userId/:logId
 * @desc    Actualizar registro de progreso existente
 * @access  Private (Usuario o su entrenador)
 */
router.put('/:userId/:logId',
  authenticate,
  validateParams(logIdSchema),
  validate(progressLogSchema.fork(['date'], (schema) => schema.optional())), // Hacer fecha opcional en updates
  authorizeTrainerAccess,
  updateProgressLog
);

/**
 * @route   DELETE /api/progress/:userId/:logId
 * @desc    Eliminar registro de progreso
 * @access  Private (Usuario o su entrenador)
 */
router.delete('/:userId/:logId',
  authenticate,
  validateParams(logIdSchema),
  authorizeTrainerAccess,
  deleteProgressLog
);

/**
 * @route   GET /api/progress/:userId/summary
 * @desc    Obtener resumen de progreso de un usuario
 * @access  Private (Usuario o su entrenador)
 */
router.get('/:userId/summary',
  authenticate,
  validateParams(userIdSchema),
  validateQuery(summaryQuerySchema),
  authorizeTrainerAccess,
  getProgressSummary
);

/**
 * @route   GET /api/progress/:userId/stats
 * @desc    Obtener estadísticas de progreso por período
 * @access  Private (Usuario o su entrenador)
 */
router.get('/:userId/stats',
  authenticate,
  validateParams(userIdSchema),
  validateQuery(statsQuerySchema),
  authorizeTrainerAccess,
  getProgressStats
);

export default router;

