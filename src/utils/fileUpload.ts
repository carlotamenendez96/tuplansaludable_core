import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import AWS from 'aws-sdk';

// Configurar AWS S3 (solo si las credenciales están disponibles)
// Asegurarse de que las credenciales no sean undefined antes de pasar al constructor
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'tu-plan-saludable-images';
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Crear directorio de uploads si no existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Crear subdirectorios
const createSubDirectories = () => {
  const subDirs = ['profiles', 'progress', 'chat'];
  subDirs.forEach(dir => {
    const dirPath = path.join(UPLOAD_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

createSubDirectories();

// Configuración de almacenamiento local
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = UPLOAD_DIR;
    
    // Determinar subdirectorio basado en el tipo de archivo
    if (req.path.includes('/progress/')) {
      uploadPath = path.join(UPLOAD_DIR, 'progress');
    } else if (req.path.includes('/chat/')) {
      uploadPath = path.join(UPLOAD_DIR, 'chat');
    } else if (req.path.includes('/profile/')) {
      uploadPath = path.join(UPLOAD_DIR, 'profiles');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generar nombre único
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    const filename = `${Date.now()}-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// Configuración de almacenamiento en memoria para S3
const memoryStorage = multer.memoryStorage();

// Filtro de archivos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Tipos de archivo permitidos
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
  }
};

// Configuración de multer para almacenamiento local
export const uploadLocal = multer({
  storage: localStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Máximo 5 archivos por request
  }
});

// Configuración de multer para S3
export const uploadS3 = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Máximo 5 archivos por request
  }
});

// Función para subir archivo a S3
export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'general'
): Promise<string> => {
  try {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    const key = `${folder}/${Date.now()}-${uniqueSuffix}${extension}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Error al subir archivo a S3:', error);
    throw new Error('Error al subir archivo');
  }
};

// Función para eliminar archivo de S3
export const deleteFromS3 = async (url: string): Promise<void> => {
  try {
    // Extraer key de la URL
    const urlParts = url.split('/');
    const key = urlParts.slice(-2).join('/'); // folder/filename

    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error al eliminar archivo de S3:', error);
    throw new Error('Error al eliminar archivo');
  }
};

// Función para subir múltiples archivos
export const uploadMultipleFiles = async (
  files: Express.Multer.File[],
  folder: string = 'general',
  useS3: boolean = false
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(async (file) => {
      if (useS3 && process.env.AWS_ACCESS_KEY_ID) {
        return await uploadToS3(file, folder);
      } else {
        // Para almacenamiento local, generar URL relativa
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const extension = path.extname(file.originalname);
        const filename = `${Date.now()}-${uniqueSuffix}${extension}`;
        const filePath = path.join(UPLOAD_DIR, folder, filename);
        
        // Crear directorio si no existe
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Guardar archivo
        fs.writeFileSync(filePath, file.buffer);
        
        // Retornar URL relativa
        return `/uploads/${folder}/${filename}`;
      }
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error al subir múltiples archivos:', error);
    throw new Error('Error al subir archivos');
  }
};

// Función para eliminar archivo local
export const deleteLocalFile = (filePath: string): void => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Error al eliminar archivo local:', error);
  }
};

// Función para validar imagen
export const validateImage = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
  // Validar tamaño
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: 'El archivo es demasiado grande (máximo 5MB)' };
  }

  // Validar tipo MIME
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    return { isValid: false, error: 'Tipo de archivo no permitido' };
  }

  // Validar extensión
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { isValid: false, error: 'Extensión de archivo no permitida' };
  }

  return { isValid: true };
};

// Función para redimensionar imagen (requiere sharp - opcional)
export const resizeImage = async (
  buffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> => {
  try {
    // Si sharp está disponible, usarlo para redimensionar
    const sharp = require('sharp');
    return await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    // Si sharp no está disponible, retornar buffer original
    console.warn('Sharp no está disponible para redimensionar imágenes');
    return buffer;
  }
};

// Middleware para manejar errores de multer
export const handleMulterError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'El archivo es demasiado grande (máximo 5MB)',
          error: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Demasiados archivos (máximo 5)',
          error: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Campo de archivo inesperado',
          error: 'UNEXPECTED_FILE_FIELD'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Error al subir archivo',
          error: 'UPLOAD_ERROR'
        });
    }
  }

  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }

  next(error);
};

// Función para obtener configuración de upload basada en el entorno
export const getUploadConfig = () => {
  const useS3 = process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID;
  
  return {
    useS3,
    upload: useS3 ? uploadS3 : uploadLocal,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  };
};

