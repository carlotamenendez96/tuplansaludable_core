import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Genera un token JWT para un usuario
 */
export const generateToken = (payload: {
  id: string | Types.ObjectId;
  email: string;
  role: UserRole;
}): string => {
  try {
    const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
      id: payload.id.toString(),
      email: payload.email,
      role: payload.role
    };

    const signOptions: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as any,
      issuer: 'tu-plan-saludable',
      audience: 'tu-plan-saludable-users'
    };

    return jwt.sign(tokenPayload, JWT_SECRET, signOptions);
  } catch (error) {
    // Asegurarse de que el error es de tipo Error antes de acceder a sus propiedades
    if (error instanceof Error) {
      throw new Error(`Error al generar el token JWT: ${error.message}`);
    } else {
      throw new Error('Error al generar el token JWT');
    }
  }
};

/**
 * Verifica y decodifica un token JWT
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'tu-plan-saludable',
      audience: 'tu-plan-saludable-users'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    } else {
      throw new Error('Error al verificar el token');
    }
  }
};

/**
 * Decodifica un token JWT sin verificar (útil para obtener información sin validar)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verifica si un token está próximo a expirar (dentro de 1 hora)
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    const oneHour = 60 * 60;
    
    return (decoded.exp - now) < oneHour;
  } catch (error) {
    return true;
  }
};

/**
 * Obtiene el tiempo restante de un token en segundos
 */
export const getTokenTimeRemaining = (token: string): number => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - now);
  } catch (error) {
    return 0;
  }
};

/**
 * Refresca un token si está próximo a expirar
 */
export const refreshTokenIfNeeded = (token: string): string | null => {
  try {
    if (isTokenExpiringSoon(token)) {
      const decoded = verifyToken(token);
      return generateToken({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      });
    }
    return null;
  } catch (error) {
    return null;
  }
};

