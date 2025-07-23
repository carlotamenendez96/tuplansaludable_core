import { Router } from 'express';
import { 
  login, 
  register, 
  getMe, 
  updateMe, 
  changePassword, 
  logout 
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { 
  validate, 
  loginSchema, 
  registerSchema, 
  updateUserSchema 
} from '../middleware/validation';
import { authLimiter } from '../middleware/security';
import Joi from 'joi';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuario y obtener token
 * @access  Public
 */
router.post('/login', 
  authLimiter,
  validate(loginSchema),
  login
);

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register',
  authLimiter,
  validate(registerSchema),
  register
);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me',
  authenticate,
  getMe
);

/**
 * @route   PUT /api/auth/me
 * @desc    Actualizar información del usuario autenticado
 * @access  Private
 */
router.put('/me',
  authenticate,
  validate(updateUserSchema),
  updateMe
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Private
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'La contraseña actual es requerida'
    }),
  newPassword: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'La nueva contraseña debe tener al menos 6 caracteres',
      'string.pattern.base': 'La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número',
      'any.required': 'La nueva contraseña es requerida'
    })
});

router.put('/change-password',
  authenticate,
  authLimiter,
  validate(changePasswordSchema),
  changePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión del usuario
 * @access  Private
 */
router.post('/logout',
  authenticate,
  logout
);

export default router;

