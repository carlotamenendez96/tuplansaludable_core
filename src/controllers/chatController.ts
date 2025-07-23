import { Request, Response } from 'express';
import { ChatMessage } from '../models/ChatMessage';
import { User } from '../models/User';
import { ISendMessageRequest, UserRole } from '../types';

/**
 * Obtener historial de mensajes entre dos usuarios
 */
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { partnerId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const currentUserId = req.user.id;
    const skip = (Number(page) - 1) * Number(limit);

    // Obtener conversación entre los dos usuarios
    const messages = await ChatMessage.find({
      $or: [
        { senderId: currentUserId, receiverId: partnerId },
        { senderId: partnerId, receiverId: currentUserId }
      ]
    })
    .populate('senderId', 'firstName lastName profilePicture')
    .populate('receiverId', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

    // Contar total de mensajes
    const total = await ChatMessage.countDocuments({
      $or: [
        { senderId: currentUserId, receiverId: partnerId },
        { senderId: partnerId, receiverId: currentUserId }
      ]
    });

    // Marcar mensajes como leídos (solo los que recibió el usuario actual)
    await ChatMessage.updateMany(
      {
        senderId: partnerId,
        receiverId: currentUserId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    // Enriquecer mensajes con información adicional
    const enrichedMessages = messages.map(message => ({
      ...message,
      isFromMe: message.senderId._id.toString() === currentUserId,
      ageInMinutes: Math.floor((Date.now() - message.createdAt.getTime()) / (1000 * 60)),
      formattedTime: message.createdAt.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isFromToday: new Date(message.createdAt).toDateString() === new Date().toDateString(),
      isRecent: (Date.now() - message.createdAt.getTime()) < (60 * 60 * 1000) // Última hora
    }));

    res.status(200).json({
      success: true,
      message: 'Mensajes obtenidos exitosamente',
      data: enrichedMessages.reverse(), // Mostrar en orden cronológico
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
        hasNext: Number(page) < Math.ceil(total / Number(limit)),
        hasPrev: Number(page) > 1
      }
    });

  } catch (error) {
    console.error('Error en getMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Enviar mensaje a otro usuario
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { partnerId } = req.params;
    const messageData: ISendMessageRequest = req.body;

    const currentUserId = req.user.id;

    // Verificar que no se esté enviando mensaje a sí mismo
    if (currentUserId === partnerId) {
      res.status(400).json({
        success: false,
        message: 'No puedes enviarte mensajes a ti mismo',
        error: 'SELF_MESSAGE_NOT_ALLOWED'
      });
      return;
    }

    // Crear nuevo mensaje
    const newMessage = new ChatMessage({
      senderId: currentUserId,
      receiverId: partnerId,
      message: messageData.message,
      messageType: messageData.messageType || 'text',
      attachments: messageData.attachments || []
    });

    await newMessage.save();

    // Poblar referencias
    await newMessage.populate([
      { path: 'senderId', select: 'firstName lastName profilePicture' },
      { path: 'receiverId', select: 'firstName lastName profilePicture' }
    ]);

    // Emitir evento de WebSocket (se implementará más adelante)
    // socketService.emitToUser(partnerId, 'new_message', newMessage);

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      data: {
        ...newMessage.toObject(),
        isFromMe: true,
        ageInMinutes: 0,
        formattedTime: newMessage.createdAt.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isFromToday: true,
        isRecent: true
      }
    });

  } catch (error) {
    console.error('Error en sendMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Obtener conversaciones recientes del usuario
 */
export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { limit = 10 } = req.query;
    const currentUserId = req.user.id;

    // Obtener conversaciones recientes usando agregación
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { senderId: currentUserId },
            { receiverId: currentUserId }
          ]
        }
      },
      {
        $addFields: {
          partnerId: {
            $cond: {
              if: { $eq: ['$senderId', currentUserId] },
              then: '$receiverId',
              else: '$senderId'
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$partnerId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', currentUserId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'partner'
        }
      },
      {
        $unwind: '$partner'
      },
      {
        $project: {
          partnerId: '$_id',
          partnerName: { $concat: ['$partner.firstName', ' ', '$partner.lastName'] },
          partnerProfilePicture: '$partner.profilePicture',
          partnerRole: '$partner.role',
          lastMessage: '$lastMessage.message',
          lastMessageType: '$lastMessage.messageType',
          lastMessageTime: '$lastMessage.createdAt',
          unreadCount: 1,
          isLastMessageFromMe: {
            $eq: ['$lastMessage.senderId', currentUserId]
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      },
      {
        $limit: Number(limit)
      }
    ]);

    // Enriquecer conversaciones con información adicional
    const enrichedConversations = conversations.map(conv => ({
      ...conv,
      lastMessageAge: Math.floor((Date.now() - conv.lastMessageTime.getTime()) / (1000 * 60)),
      lastMessageFormatted: conv.lastMessageTime.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isLastMessageFromToday: new Date(conv.lastMessageTime).toDateString() === new Date().toDateString()
    }));

    res.status(200).json({
      success: true,
      message: 'Conversaciones obtenidas exitosamente',
      data: enrichedConversations
    });

  } catch (error) {
    console.error('Error en getConversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Marcar mensajes como leídos
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { partnerId } = req.params;
    const currentUserId = req.user.id;

    // Marcar todos los mensajes del partner como leídos
    const result = await ChatMessage.updateMany(
      {
        senderId: partnerId,
        receiverId: currentUserId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Mensajes marcados como leídos',
      data: {
        markedCount: result.modifiedCount,
        partnerId
      }
    });

  } catch (error) {
    console.error('Error en markAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Obtener conteo de mensajes no leídos
 */
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const currentUserId = req.user.id;

    // Contar mensajes no leídos
    const unreadCount = await ChatMessage.countDocuments({
      receiverId: currentUserId,
      isRead: false
    });

    // Obtener conteo por remitente
    const unreadBySender = await ChatMessage.aggregate([
      {
        $match: {
          receiverId: currentUserId,
          isRead: false
        }
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $unwind: '$sender'
      },
      {
        $project: {
          senderId: '$_id',
          senderName: { $concat: ['$sender.firstName', ' ', '$sender.lastName'] },
          count: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Conteo de mensajes no leídos obtenido exitosamente',
      data: {
        totalUnread: unreadCount,
        unreadBySender
      }
    });

  } catch (error) {
    console.error('Error en getUnreadCount:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Eliminar mensaje
 */
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { messageId } = req.params;
    const currentUserId = req.user.id;

    // Buscar mensaje
    const message = await ChatMessage.findById(messageId);

    if (!message) {
      res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado',
        error: 'MESSAGE_NOT_FOUND'
      });
      return;
    }

    // Solo el remitente puede eliminar el mensaje
    if (message.senderId.toString() !== currentUserId) {
      res.status(403).json({
        success: false,
        message: 'Solo puedes eliminar tus propios mensajes',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Eliminar mensaje
    await ChatMessage.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: 'Mensaje eliminado exitosamente',
      data: {
        deletedMessageId: messageId
      }
    });

  } catch (error) {
    console.error('Error en deleteMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Buscar mensajes
 */
export const searchMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { partnerId } = req.params;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Query de búsqueda es requerido',
        error: 'SEARCH_QUERY_REQUIRED'
      });
      return;
    }

    const currentUserId = req.user.id;
    const skip = (Number(page) - 1) * Number(limit);

    // Buscar mensajes que contengan el texto
    const searchQuery = {
      $and: [
        {
          $or: [
            { senderId: currentUserId, receiverId: partnerId },
            { senderId: partnerId, receiverId: currentUserId }
          ]
        },
        {
          message: { $regex: query.trim(), $options: 'i' }
        }
      ]
    };

    const messages = await ChatMessage.find(searchQuery)
      .populate('senderId', 'firstName lastName profilePicture')
      .populate('receiverId', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await ChatMessage.countDocuments(searchQuery);

    // Enriquecer resultados
    const enrichedMessages = messages.map(message => ({
      ...message,
      isFromMe: message.senderId._id.toString() === currentUserId,
      highlightedMessage: message.message.replace(
        new RegExp(query.trim(), 'gi'),
        `<mark>$&</mark>`
      )
    }));

    res.status(200).json({
      success: true,
      message: 'Búsqueda de mensajes completada',
      data: enrichedMessages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      searchQuery: query.trim()
    });

  } catch (error) {
    console.error('Error en searchMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

