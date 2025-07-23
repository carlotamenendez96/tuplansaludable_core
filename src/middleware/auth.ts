import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { UserRole } from '../types';
import { Types } from 'mongoose';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        firstName: string;
        lastName: string;
      };
    }
  }
}

/**
 * Middleware para autenticar usuarios usando JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Token de acceso requerido',
        error: 'NO_TOKEN'
      });
      return;
    }

    // Verificar formato del header (Bearer <token>)
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer <token>',
        error: 'INVALID_TOKEN_FORMAT'
      });
      return;
    }

    const token = tokenParts[1];

    // Verificar y decodificar el token
    let decoded: JWTPayload;
    try {
      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Token de acceso requerido',
          error: 'NO_TOKEN'
        });
        return;
      }
      decoded = verifyToken(token);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Token inválido',
        error: 'INVALID_TOKEN'
      });
      return;
    }

    // Buscar el usuario en la base de datos
    const user = await User.findById(decoded.id).select('+password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Cuenta desactivada',
        error: 'ACCOUNT_DISABLED'
      });
      return;
    }

    // Agregar información del usuario al request
    req.user = {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Middleware para autorizar usuarios por rol
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware para verificar que un entrenador solo acceda a sus clientes
 */
export const authorizeTrainerAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    
    // Si es el mismo usuario, permitir acceso
    if (req.user.id === userId) {
      next();
      return;
    }

    // Si es un entrenador, verificar que el usuario sea su cliente
    if (req.user.role === UserRole.TRAINER) {
      const client = await User.findById(userId);
      
      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
          error: 'USER_NOT_FOUND'
        });
        return;
      }

      if (client.trainerId?.toString() !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a los datos de este usuario',
          error: 'NOT_YOUR_CLIENT'
        });
        return;
      }
    } else {
      // Si no es entrenador y no es el mismo usuario, denegar acceso
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error en middleware de autorización de entrenador:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Middleware para verificar acceso a conversaciones de chat
 */
export const authorizeChatAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    // Verificar que el partner existe
    const partner = await User.findById(partnerId);
    if (!partner) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Verificar relación entre usuarios (cliente-entrenador)
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      res.status(404).json({
        success: false,
        message: 'Usuario actual no encontrado',
        error: 'CURRENT_USER_NOT_FOUND'
      });
      return;
    }

    let hasPermission = false;

    // Si el usuario actual es entrenador, verificar que el partner sea su cliente
    if (currentUser.role === UserRole.TRAINER) {
      hasPermission = partner.trainerId?.toString() === currentUserId;
    }
    // Si el usuario actual es cliente, verificar que el partner sea su entrenador
    else if (currentUser.role === UserRole.USER) {
      hasPermission = currentUser.trainerId?.toString() === partnerId;
    }

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para chatear con este usuario',
        error: 'CHAT_NOT_ALLOWED'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error en middleware de autorización de chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = tokenParts[1];

    try {
      if (!token) {
        next();
        return;
      }
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = {
          id: (user._id as Types.ObjectId).toString(),
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        };
      }
    } catch (error) {
      // Ignorar errores de token en autenticación opcional
    }

    next();
  } catch (error) {
    console.error('Error en middleware de autenticación opcional:', error);
    next();
  }
};

