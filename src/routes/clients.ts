import { Router } from 'express';
import {
  getClients,
  getClientById,
  assignClient,
  unassignClient,
  getClientsStats
} from '../controllers/clientController';
import { authenticate, authorize } from '../middleware/auth';
import { validateParams, validateQuery, objectIdSchema, paginationSchema } from '../middleware/validation';
import { UserRole } from '../types';
import Joi from 'joi';

const router = Router();

// Esquema de validación para query parameters de clientes
const clientsQuerySchema = paginationSchema.keys({
  search: Joi.string().trim().optional(),
  sortBy: Joi.string().valid('createdAt', 'firstName', 'lastName', 'email').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * @route   GET /api/clients
 * @desc    Obtener lista de clientes del entrenador autenticado
 * @access  Private (Solo entrenadores)
 */
router.get('/',
  authenticate,
  authorize(UserRole.TRAINER),
  validateQuery(clientsQuerySchema),
  getClients
);

/**
 * @route   GET /api/clients/stats
 * @desc    Obtener estadísticas de todos los clientes del entrenador
 * @access  Private (Solo entrenadores)
 */
router.get('/stats',
  authenticate,
  authorize(UserRole.TRAINER),
  getClientsStats
);

/**
 * @route   GET /api/clients/:clientId
 * @desc    Obtener información detallada de un cliente específico
 * @access  Private (Entrenador del cliente)
 */
const clientIdSchema = Joi.object({
  clientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID de cliente inválido',
      'any.required': 'ID de cliente es requerido'
    })
});

router.get('/:clientId',
  authenticate,
  validateParams(clientIdSchema),
  getClientById
);

/**
 * @route   POST /api/clients/:clientId/assign
 * @desc    Asignar un cliente al entrenador autenticado
 * @access  Private (Solo entrenadores)
 */
router.post('/:clientId/assign',
  authenticate,
  authorize(UserRole.TRAINER),
  validateParams(clientIdSchema),
  assignClient
);

/**
 * @route   DELETE /api/clients/:clientId/assign
 * @desc    Desasignar un cliente del entrenador autenticado
 * @access  Private (Solo entrenadores)
 */
router.delete('/:clientId/assign',
  authenticate,
  authorize(UserRole.TRAINER),
  validateParams(clientIdSchema),
  unassignClient
);

export default router;

