import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { ILoginRequest, ILoginResponse, ICreateUserRequest, UserRole, IUser } from '../types';

/**
 * Login de usuario
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: ILoginRequest = req.body;

    // Buscar usuario por email (incluir password para verificación)
    const user = await User.findOne({ email, isActive: true }).select('+password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Verificar contraseña
    // Asegurarse de que user es del tipo correcto para acceder a comparePassword
    const isPasswordValid = await (user as any).comparePassword(password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Generar token JWT
    const token = generateToken({
      id: user._id as Types.ObjectId,
      email: user.email,
      role: user.role
    });

    // Preparar respuesta
    const response: ILoginResponse = {
      token,
      user: {
        id: (user._id as Types.ObjectId).toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture // profilePicture ya es opcional en ILoginResponse
      }
    };

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: response
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Registro de usuario
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: ICreateUserRequest = req.body;

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este email',
        error: 'EMAIL_ALREADY_EXISTS'
      });
      return;
    }

    // Si se especifica un trainerId, verificar que existe y es entrenador
    if (userData.trainerId) {
      const trainer = await User.findById(userData.trainerId);
      
      if (!trainer) {
        res.status(400).json({
          success: false,
          message: 'Entrenador no encontrado',
          error: 'TRAINER_NOT_FOUND'
        });
        return;
      }

      if (trainer.role !== UserRole.TRAINER) {
        res.status(400).json({
          success: false,
          message: 'El usuario especificado no es un entrenador',
          error: 'NOT_A_TRAINER'
        });
        return;
      }
    }

    // Crear nuevo usuario
    const newUser = new User(userData);
    await newUser.save();

    // Si el usuario se asignó a un entrenador, actualizar la lista de clientes del entrenador
    if (userData.trainerId) {
      await User.findByIdAndUpdate(
        userData.trainerId,
        { $addToSet: { clients: newUser._id } }
      );
    }

    // Generar token JWT
    const token = generateToken({
      id: newUser._id as Types.ObjectId,
      email: newUser.email,
      role: newUser.role
    });

    // Preparar respuesta (sin datos sensibles)
    const response: ILoginResponse = {
      token,
      user: {
        id: (newUser._id as Types.ObjectId).toString(),
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        profilePicture: newUser.profilePicture
      }
    };

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: response
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Obtener información del usuario autenticado
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    // Buscar usuario completo
    const user = await User.findById(req.user.id)
      .populate('trainerId', 'firstName lastName email profilePicture')
      .populate('clients', 'firstName lastName email profilePicture');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Asegurarse de que user es del tipo correcto para acceder a los métodos y virtuales
    const typedUser = user as IUser;

    // Calcular información adicional
    const userInfo = {
      id: typedUser._id.toString(),
      email: typedUser.email,
      firstName: typedUser.firstName,
      lastName: typedUser.lastName,
      role: typedUser.role,
      profilePicture: typedUser.profilePicture,
      dateOfBirth: typedUser.dateOfBirth,
      gender: typedUser.gender,
      height: typedUser.height,
      weight: typedUser.weight,
      activityLevel: typedUser.activityLevel,
      goals: typedUser.goals,
      medicalConditions: typedUser.medicalConditions,
      allergies: typedUser.allergies,
      trainerId: typedUser.trainerId,
      clients: typedUser.clients,
      isActive: typedUser.isActive,
      createdAt: typedUser.createdAt,
      updatedAt: typedUser.updatedAt,
      // Información calculada
      fullName: typedUser.getFullName(),
      age: typedUser.getAge(),
      bmi: typedUser.getBMI(),
      clientCount: typedUser.clientCount
    };

    res.status(200).json({
      success: true,
      message: 'Información del usuario obtenida exitosamente',
      data: userInfo
    });

  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Actualizar información del usuario autenticado
 */
export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    // Campos que no se pueden actualizar a través de este endpoint
    const restrictedFields = ['email', 'password', 'role', 'trainerId', 'clients', 'isActive'];
    
    // Filtrar campos restringidos
    const updateData = { ...req.body };
    restrictedFields.forEach(field => delete updateData[field]);

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('trainerId', 'firstName lastName email profilePicture');

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Información actualizada exitosamente',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error en updateMe:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Cambiar contraseña del usuario autenticado
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son requeridas',
        error: 'MISSING_PASSWORDS'
      });
      return;
    }

    // Buscar usuario con contraseña
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Verificar contraseña actual
    // Asegurarse de que user es del tipo correcto para acceder a comparePassword
    const isCurrentPasswordValid = await (user as any).comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta',
        error: 'INVALID_CURRENT_PASSWORD'
      });
      return;
    }

    // Validar nueva contraseña
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
        error: 'PASSWORD_TOO_SHORT'
      });
      return;
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Logout (invalidar token - en una implementación real se usaría una blacklist)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // En una implementación real, aquí se añadiría el token a una blacklist
    // Por ahora, simplemente retornamos éxito
    
    res.status(200).json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

