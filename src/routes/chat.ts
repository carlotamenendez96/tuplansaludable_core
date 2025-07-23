import { Router } from 'express';
import {
  getMessages,
  sendMessage,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteMessage,
  searchMessages
} from '../controllers/chatController';
import { authenticate, authorizeChatAccess } from '../middleware/auth';
import { 
  validate, 
  validateParams, 
  validateQuery,
  partnerIdSchema, 
  sendMessageSchema 
} from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Esquema para validar query parameters de mensajes
const messagesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50)
});

// Esquema para validar query parameters de conversaciones
const conversationsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10)
});

// Esquema para validar messageId
const messageIdSchema = Joi.object({
  messageId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID de mensaje inválido',
      'any.required': 'ID de mensaje es requerido'
    })
});

// Esquema para validar búsqueda de mensajes
const searchQuerySchema = Joi.object({
  query: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'La consulta debe tener al menos 1 caracter',
      'string.max': 'La consulta no puede exceder 100 caracteres',
      'any.required': 'La consulta de búsqueda es requerida'
    }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

/**
 * @route   GET /api/chat/conversations
 * @desc    Obtener conversaciones recientes del usuario
 * @access  Private
 */
router.get('/conversations',
  authenticate,
  validateQuery(conversationsQuerySchema),
  getConversations
);

/**
 * @route   GET /api/chat/unread
 * @desc    Obtener conteo de mensajes no leídos
 * @access  Private
 */
router.get('/unread',
  authenticate,
  getUnreadCount
);

/**
 * @route   GET /api/chat/:partnerId
 * @desc    Obtener historial de mensajes con un usuario específico
 * @access  Private (Solo si hay relación entrenador-cliente)
 */
router.get('/:partnerId',
  authenticate,
  validateParams(partnerIdSchema),
  validateQuery(messagesQuerySchema),
  authorizeChatAccess,
  getMessages
);

/**
 * @route   POST /api/chat/:partnerId
 * @desc    Enviar mensaje a un usuario específico
 * @access  Private (Solo si hay relación entrenador-cliente)
 */
router.post('/:partnerId',
  authenticate,
  validateParams(partnerIdSchema),
  validate(sendMessageSchema),
  authorizeChatAccess,
  sendMessage
);

/**
 * @route   PUT /api/chat/:partnerId/read
 * @desc    Marcar mensajes como leídos
 * @access  Private (Solo si hay relación entrenador-cliente)
 */
router.put('/:partnerId/read',
  authenticate,
  validateParams(partnerIdSchema),
  authorizeChatAccess,
  markAsRead
);

/**
 * @route   GET /api/chat/:partnerId/search
 * @desc    Buscar mensajes en una conversación
 * @access  Private (Solo si hay relación entrenador-cliente)
 */
router.get('/:partnerId/search',
  authenticate,
  validateParams(partnerIdSchema),
  validateQuery(searchQuerySchema),
  authorizeChatAccess,
  searchMessages
);

/**
 * @route   DELETE /api/chat/message/:messageId
 * @desc    Eliminar un mensaje específico
 * @access  Private (Solo el remitente)
 */
router.delete('/message/:messageId',
  authenticate,
  validateParams(messageIdSchema),
  deleteMessage
);

export default router;

