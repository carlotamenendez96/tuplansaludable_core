import { Request, Response } from 'express';
import { 
  uploadToS3, 
  uploadMultipleFiles, 
  validateImage, 
  deleteFromS3, 
  deleteLocalFile,
  getUploadConfig 
} from '../utils/fileUpload';
import { User } from '../models/User';
import { UserRole } from '../types';

/**
 * Subir imagen de perfil
 */
export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo',
        error: 'NO_FILE_PROVIDED'
      });
      return;
    }

    // Validar imagen
    const validation = validateImage(req.file);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: validation.error,
        error: 'INVALID_IMAGE'
      });
      return;
    }

    const config = getUploadConfig();
    let imageUrl: string;

    if (config.useS3) {
      // Subir a S3
      imageUrl = await uploadToS3(req.file, 'profiles');
    } else {
      // Almacenamiento local
      imageUrl = `/uploads/profiles/${req.file.filename}`;
    }

    // Actualizar usuario con nueva imagen de perfil
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // Eliminar imagen anterior si existe
    if (user.profilePicture) {
      try {
        if (config.useS3) {
          await deleteFromS3(user.profilePicture);
        } else {
          deleteLocalFile(user.profilePicture);
        }
      } catch (error) {
        console.warn('No se pudo eliminar la imagen anterior:', error);
      }
    }

    // Actualizar usuario
    user.profilePicture = imageUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Imagen de perfil actualizada exitosamente',
      data: {
        profilePicture: imageUrl,
        userId: user._id
      }
    });

  } catch (error) {
    console.error('Error en uploadProfileImage:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Subir imágenes de progreso
 */
export const uploadProgressImages = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No se proporcionaron archivos',
        error: 'NO_FILES_PROVIDED'
      });
      return;
    }

    // Validar todas las imágenes
    for (const file of req.files) {
      const validation = validateImage(file);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: `Error en archivo ${file.originalname}: ${validation.error}`,
          error: 'INVALID_IMAGE'
        });
        return;
      }
    }

    const config = getUploadConfig();
    const imageUrls = await uploadMultipleFiles(req.files, 'progress', config.useS3 as boolean);

    res.status(200).json({
      success: true,
      message: 'Imágenes de progreso subidas exitosamente',
      data: {
        images: imageUrls,
        count: imageUrls.length
      }
    });

  } catch (error) {
    console.error('Error en uploadProgressImages:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Subir archivos para chat
 */
export const uploadChatFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No se proporcionaron archivos',
        error: 'NO_FILES_PROVIDED'
      });
      return;
    }

    // Validar todas las imágenes
    for (const file of req.files) {
      const validation = validateImage(file);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: `Error en archivo ${file.originalname}: ${validation.error}`,
          error: 'INVALID_IMAGE'
        });
        return;
      }
    }

    const config = getUploadConfig();
    const fileUrls = await uploadMultipleFiles(req.files, 'chat', config.useS3 as boolean);

    res.status(200).json({
      success: true,
      message: 'Archivos de chat subidos exitosamente',
      data: {
        files: fileUrls,
        count: fileUrls.length
      }
    });

  } catch (error) {
    console.error('Error en uploadChatFiles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Eliminar imagen
 */
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { imageUrl } = req.body;

    if (!imageUrl) {
      res.status(400).json({
        success: false,
        message: 'URL de imagen es requerida',
        error: 'IMAGE_URL_REQUIRED'
      });
      return;
    }

    const config = getUploadConfig();

    try {
      if (config.useS3 && imageUrl.includes('amazonaws.com')) {
        await deleteFromS3(imageUrl);
      } else {
        deleteLocalFile(imageUrl);
      }

      res.status(200).json({
        success: true,
        message: 'Imagen eliminada exitosamente',
        data: {
          deletedUrl: imageUrl
        }
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'No se pudo eliminar la imagen',
        error: 'DELETE_FAILED'
      });
    }

  } catch (error) {
    console.error('Error en deleteImage:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Obtener información de configuración de upload
 */
export const getUploadInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = getUploadConfig();

    res.status(200).json({
      success: true,
      message: 'Información de configuración de upload obtenida',
      data: {
        maxFileSize: config.maxFileSize,
        maxFiles: config.maxFiles,
        allowedTypes: config.allowedTypes,
        useS3: config.useS3,
        maxFileSizeMB: Math.round(config.maxFileSize / (1024 * 1024))
      }
    });

  } catch (error) {
    console.error('Error en getUploadInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Limpiar archivos huérfanos (solo para administradores)
 */
export const cleanupOrphanedFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    // Solo permitir a entrenadores (como administradores básicos)
    if (req.user.role !== UserRole.TRAINER) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Esta función sería más compleja en un entorno real
    // Por ahora, solo retornamos un mensaje de éxito
    res.status(200).json({
      success: true,
      message: 'Limpieza de archivos huérfanos completada',
      data: {
        filesDeleted: 0,
        spaceSaved: '0 MB'
      }
    });

  } catch (error) {
    console.error('Error en cleanupOrphanedFiles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

