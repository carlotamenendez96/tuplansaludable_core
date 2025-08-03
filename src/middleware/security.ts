import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

/**
 * Configuración de CORS
 */
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Permitir requests sin origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    // En desarrollo, permitir cualquier origen
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // En producción, usar lista de orígenes permitidos
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

/**
 * Configuración de Helmet para seguridad
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://unpkg.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Rate limiting general
 */
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta de nuevo más tarde',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Saltar rate limiting para rutas de salud
    return req.path === '/health' || req.path === '/api/health';
  }
});

/**
 * Rate limiting estricto para autenticación
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos de login por IP
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos',
    error: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // No contar requests exitosos
});

/**
 * Rate limiting para endpoints de creación
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 creaciones por minuto
  message: {
    success: false,
    message: 'Demasiadas creaciones, intenta de nuevo en un minuto',
    error: 'CREATE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiting para subida de archivos
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // 5 subidas por minuto
  message: {
    success: false,
    message: 'Demasiadas subidas de archivos, intenta de nuevo en un minuto',
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Middleware para manejo de errores
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error capturado:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Error de validación de Mongoose
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message
    }));

    res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors
    });
    return;
  }

  // Error de duplicado de Mongoose
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    res.status(400).json({
      success: false,
      message: `Ya existe un registro con este ${field}`,
      error: 'DUPLICATE_FIELD'
    });
    return;
  }

  // Error de cast de Mongoose (ID inválido)
  if (error.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'ID inválido',
      error: 'INVALID_ID'
    });
    return;
  }

  // Error de JWT
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: 'INVALID_TOKEN'
    });
    return;
  }

  // Error de token expirado
  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expirado',
      error: 'TOKEN_EXPIRED'
    });
    return;
  }

  // Error de Multer (subida de archivos)
  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      message: 'El archivo es demasiado grande',
      error: 'FILE_TOO_LARGE'
    });
    return;
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    res.status(400).json({
      success: false,
      message: 'Demasiados archivos',
      error: 'TOO_MANY_FILES'
    });
    return;
  }

  // Error personalizado con status
  if (error.status || error.statusCode) {
    res.status(error.status || error.statusCode).json({
      success: false,
      message: error.message || 'Error del servidor',
      error: error.code || 'SERVER_ERROR'
    });
    return;
  }

  // Error genérico del servidor
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message,
    error: 'INTERNAL_SERVER_ERROR'
  });
};

/**
 * Middleware para rutas no encontradas
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    error: 'ROUTE_NOT_FOUND'
  });
};

/**
 * Middleware para logging de requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    // Solo loggear errores y requests lentos en producción
    if (process.env.NODE_ENV === 'production') {
      if (res.statusCode >= 400 || duration > 1000) {
        console.log('Request:', logData);
      }
    } else {
      console.log('Request:', logData);
    }
  });

  next();
};

/**
 * Middleware para validar Content-Type en requests POST/PUT
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction): void => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      res.status(400).json({
        success: false,
        message: 'Content-Type header es requerido',
        error: 'MISSING_CONTENT_TYPE'
      });
      return;
    }

    if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      res.status(400).json({
        success: false,
        message: 'Content-Type debe ser application/json o multipart/form-data',
        error: 'INVALID_CONTENT_TYPE'
      });
      return;
    }
  }

  next();
};

/**
 * Middleware para sanitizar entrada de datos
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Función recursiva para sanitizar objetos
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remover caracteres peligrosos
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

