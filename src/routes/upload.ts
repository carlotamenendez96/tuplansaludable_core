import { Router } from 'express';
import {
  uploadProfileImage,
  uploadProgressImages,
  uploadChatFiles,
  deleteImage,
  getUploadInfo,
  cleanupOrphanedFiles
} from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadLimiter } from '../middleware/security';
import { getUploadConfig, handleMulterError } from '../utils/fileUpload';
import { UserRole } from '../types';
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const uploadConfig = getUploadConfig();

/**
 * @route   GET /api/upload/info
 * @desc    Obtener información de configuración de upload
 * @access  Private
 */
router.get('/info',
  authenticate,
  getUploadInfo
);

/**
 * @route   POST /api/upload/profile
 * @desc    Subir imagen de perfil
 * @access  Private
 */
router.post('/profile',
  authenticate,
  uploadLimiter,
  uploadConfig.upload.single('profileImage'),
  handleMulterError,
  uploadProfileImage
);

/**
 * @route   POST /api/upload/progress
 * @desc    Subir imágenes de progreso
 * @access  Private
 */
router.post('/progress',
  authenticate,
  uploadLimiter,
  uploadConfig.upload.array('progressImages', 5),
  handleMulterError,
  uploadProgressImages
);

/**
 * @route   POST /api/upload/chat
 * @desc    Subir archivos para chat
 * @access  Private
 */
router.post('/chat',
  authenticate,
  uploadLimiter,
  uploadConfig.upload.array('chatFiles', 3),
  handleMulterError,
  uploadChatFiles
);

/**
 * @route   DELETE /api/upload/image
 * @desc    Eliminar imagen
 * @access  Private
 */
const deleteImageSchema = Joi.object({
  imageUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Debe ser una URL válida',
      'any.required': 'La URL de la imagen es requerida'
    })
});

router.delete('/image',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = deleteImageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    req.body = value;
    return next();
  },
  deleteImage
);

/**
 * @route   POST /api/upload/cleanup
 * @desc    Limpiar archivos huérfanos
 * @access  Private (Solo entrenadores)
 */
router.post('/cleanup',
  authenticate,
  authorize(UserRole.TRAINER),
  cleanupOrphanedFiles
);

export default router;


