import { Request, Response } from 'express';
import { ProgressLog } from '../models/ProgressLog';
import { User } from '../models/User';
import { ICreateProgressLogRequest, UserRole } from '../types';

/**
 * Obtener registros de progreso de un usuario
 */
export const getProgressLogs = async (req: Request, res: Response): Promise<void> => {
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
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros de fecha
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }

    // Construir query
    const query: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }

    // Construir sort object
    const sortObject: any = {};
    sortObject[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Ejecutar consulta con paginación
    const skip = (Number(page) - 1) * Number(limit);
    const progressLogs = await ProgressLog.find(query)
      .sort(sortObject)
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'firstName lastName email height')
      .lean();

    // Contar total de documentos
    const total = await ProgressLog.countDocuments(query);
    const totalPages = Math.ceil(total / Number(limit));

    // Enriquecer datos con información calculada
    const enrichedLogs = progressLogs.map(log => {
      const user = log.userId as any;
      let bmi = null;
      
      if (log.weight && user.height) {
        const heightInMeters = user.height / 100;
        bmi = Number((log.weight / (heightInMeters * heightInMeters)).toFixed(1));
      }

      // Calcular puntuación de completitud
      let completionScore = 0;
      const maxScore = 100;
      
      if (log.weight) completionScore += 20;
      if (log.measurements && Object.keys(log.measurements).length > 0) completionScore += 15;
      if (log.mood) completionScore += 10;
      if (log.energyLevel) completionScore += 10;
      if (log.sleepHours) completionScore += 10;
      if (log.waterIntake) completionScore += 10;
      if (log.workoutCompleted) completionScore += 15;
      if (log.nutritionLog) completionScore += 10;

      return {
        ...log,
        bmi,
        completionScore: Math.min(completionScore, maxScore),
        hasWorkout: !!log.workoutCompleted,
        hasNutritionLog: !!log.nutritionLog,
        isFromToday: new Date(log.date).toDateString() === new Date().toDateString()
      };
    });

    res.status(200).json({
      success: true,
      message: 'Registros de progreso obtenidos exitosamente',
      data: enrichedLogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });

  } catch (error) {
    console.error('Error en getProgressLogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Crear nuevo registro de progreso
 */
export const createProgressLog = async (req: Request, res: Response): Promise<void> => {
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
    const progressData: ICreateProgressLogRequest = req.body;

    // Los usuarios solo pueden crear registros para sí mismos
    if (req.user.role === UserRole.USER && req.user.id !== userId) {
      res.status(403).json({
        success: false,
        message: 'Solo puedes crear registros de progreso para ti mismo',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Los entrenadores solo pueden crear registros para sus clientes
    if (req.user.role === UserRole.TRAINER) {
      const client = await User.findById(userId);
      if (!client || client.trainerId?.toString() !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para crear registros para este usuario',
          error: 'NOT_YOUR_CLIENT'
        });
        return;
      }
    }

    // Verificar si ya existe un registro para esta fecha
    const existingLog = await ProgressLog.findOne({
      userId,
      date: {
        $gte: new Date(progressData.date).setHours(0, 0, 0, 0),
        $lt: new Date(progressData.date).setHours(23, 59, 59, 999)
      }
    });

    if (existingLog) {
      res.status(400).json({
        success: false,
        message: 'Ya existe un registro de progreso para esta fecha',
        error: 'PROGRESS_LOG_EXISTS'
      });
      return;
    }

    // Crear nuevo registro
    const newProgressLog = new ProgressLog({
      userId,
      ...progressData
    });

    await newProgressLog.save();

    // Poblar referencias
    await newProgressLog.populate('userId', 'firstName lastName email height');

    res.status(201).json({
      success: true,
      message: 'Registro de progreso creado exitosamente',
      data: newProgressLog
    });

  } catch (error) {
    console.error('Error en createProgressLog:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Actualizar registro de progreso existente
 */
export const updateProgressLog = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { userId, logId } = req.params;
    const updateData = req.body;

    // Buscar el registro
    const progressLog = await ProgressLog.findById(logId);

    if (!progressLog) {
      res.status(404).json({
        success: false,
        message: 'Registro de progreso no encontrado',
        error: 'PROGRESS_LOG_NOT_FOUND'
      });
      return;
    }

    // Verificar que el registro pertenece al usuario correcto
    if (progressLog.userId.toString() !== userId) {
      res.status(400).json({
        success: false,
        message: 'El registro no pertenece al usuario especificado',
        error: 'INVALID_USER_LOG'
      });
      return;
    }

    // Los usuarios solo pueden actualizar sus propios registros
    if (req.user.role === UserRole.USER && req.user.id !== userId) {
      res.status(403).json({
        success: false,
        message: 'Solo puedes actualizar tus propios registros',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Los entrenadores solo pueden actualizar registros de sus clientes
    if (req.user.role === UserRole.TRAINER) {
      const client = await User.findById(userId);
      if (!client || client.trainerId?.toString() !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para actualizar registros de este usuario',
          error: 'NOT_YOUR_CLIENT'
        });
        return;
      }
    }

    // Actualizar registro
    const updatedProgressLog = await ProgressLog.findByIdAndUpdate(
      logId,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('userId', 'firstName lastName email height');

    res.status(200).json({
      success: true,
      message: 'Registro de progreso actualizado exitosamente',
      data: updatedProgressLog
    });

  } catch (error) {
    console.error('Error en updateProgressLog:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Eliminar registro de progreso
 */
export const deleteProgressLog = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { userId, logId } = req.params;

    // Buscar el registro
    const progressLog = await ProgressLog.findById(logId);

    if (!progressLog) {
      res.status(404).json({
        success: false,
        message: 'Registro de progreso no encontrado',
        error: 'PROGRESS_LOG_NOT_FOUND'
      });
      return;
    }

    // Verificar que el registro pertenece al usuario correcto
    if (progressLog.userId.toString() !== userId) {
      res.status(400).json({
        success: false,
        message: 'El registro no pertenece al usuario especificado',
        error: 'INVALID_USER_LOG'
      });
      return;
    }

    // Los usuarios solo pueden eliminar sus propios registros
    if (req.user.role === UserRole.USER && req.user.id !== userId) {
      res.status(403).json({
        success: false,
        message: 'Solo puedes eliminar tus propios registros',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Los entrenadores solo pueden eliminar registros de sus clientes
    if (req.user.role === UserRole.TRAINER) {
      const client = await User.findById(userId);
      if (!client || client.trainerId?.toString() !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar registros de este usuario',
          error: 'NOT_YOUR_CLIENT'
        });
        return;
      }
    }

    // Eliminar registro
    await ProgressLog.findByIdAndDelete(logId);

    res.status(200).json({
      success: true,
      message: 'Registro de progreso eliminado exitosamente',
      data: {
        deletedLogId: logId,
        userId
      }
    });

  } catch (error) {
    console.error('Error en deleteProgressLog:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Obtener resumen de progreso de un usuario
 */
export const getProgressSummary = async (req: Request, res: Response): Promise<void> => {
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
    const { days = 30 } = req.query;

    // Calcular fecha de inicio
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Obtener resumen usando agregación
    const summary = await ProgressLog.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          avgWeight: { $avg: '$weight' },
          avgBodyFat: { $avg: '$bodyFat' },
          avgMuscleMass: { $avg: '$muscleMass' },
          avgMood: { $avg: '$mood' },
          avgEnergyLevel: { $avg: '$energyLevel' },
          avgSleepHours: { $avg: '$sleepHours' },
          avgWaterIntake: { $avg: '$waterIntake' },
          totalWorkouts: {
            $sum: {
              $cond: [{ $ifNull: ['$workoutCompleted', false] }, 1, 0]
            }
          },
          totalWorkoutTime: { $sum: '$workoutCompleted.duration' },
          totalCaloriesBurned: { $sum: '$workoutCompleted.caloriesBurned' },
          avgCompletionScore: {
            $avg: {
              $add: [
                { $cond: [{ $ifNull: ['$weight', false] }, 20, 0] },
                { $cond: [{ $ifNull: ['$measurements', false] }, 15, 0] },
                { $cond: [{ $ifNull: ['$mood', false] }, 10, 0] },
                { $cond: [{ $ifNull: ['$energyLevel', false] }, 10, 0] },
                { $cond: [{ $ifNull: ['$sleepHours', false] }, 10, 0] },
                { $cond: [{ $ifNull: ['$waterIntake', false] }, 10, 0] },
                { $cond: [{ $ifNull: ['$workoutCompleted', false] }, 15, 0] },
                { $cond: [{ $ifNull: ['$nutritionLog', false] }, 10, 0] }
              ]
            }
          }
        }
      }
    ]);

    // Obtener tendencias de peso (últimos 10 registros con peso)
    const weightTrend = await ProgressLog.find({
      userId,
      weight: { $exists: true, $ne: null }
    })
    .sort({ date: -1 })
    .limit(10)
    .select('date weight')
    .lean();

    // Obtener último registro
    const latestLog = await ProgressLog.findOne({ userId })
      .sort({ date: -1 })
      .populate('userId', 'firstName lastName email height')
      .lean();

    // Calcular cambio de peso
    let weightChange = null;
    if (weightTrend.length >= 2) {
      const latest = weightTrend[0]?.weight as number | undefined;
      const previous = weightTrend[1]?.weight as number | undefined;
      if (latest && previous) {
        weightChange = Number((latest - previous).toFixed(1));
      }
    }

    // Preparar respuesta
    const summaryData = {
      period: {
        days: Number(days),
        startDate,
        endDate: new Date()
      },
      statistics: summary[0] || {
        totalLogs: 0,
        avgWeight: null,
        avgBodyFat: null,
        avgMuscleMass: null,
        avgMood: null,
        avgEnergyLevel: null,
        avgSleepHours: null,
        avgWaterIntake: null,
        totalWorkouts: 0,
        totalWorkoutTime: 0,
        totalCaloriesBurned: 0,
        avgCompletionScore: 0
      },
      trends: {
        weight: weightTrend.reverse(), // Mostrar en orden cronológico
        weightChange
      },
      latestLog
    };

    res.status(200).json({
      success: true,
      message: 'Resumen de progreso obtenido exitosamente',
      data: summaryData
    });

  } catch (error) {
    console.error('Error en getProgressSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Obtener estadísticas de progreso por período
 */
export const getProgressStats = async (req: Request, res: Response): Promise<void> => {
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
    const { period = 'week' } = req.query; // 'week', 'month', 'year'

    // Calcular fechas según el período
    let startDate = new Date();
    let groupBy: any = {};

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
    }

    // Obtener estadísticas agrupadas por período
    const stats = await ProgressLog.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          avgWeight: { $avg: '$weight' },
          avgBodyFat: { $avg: '$bodyFat' },
          avgMood: { $avg: '$mood' },
          avgEnergyLevel: { $avg: '$energyLevel' },
          avgSleepHours: { $avg: '$sleepHours' },
          workoutCount: {
            $sum: {
              $cond: [{ $ifNull: ['$workoutCompleted', false] }, 1, 0]
            }
          },
          totalWorkoutTime: { $sum: '$workoutCompleted.duration' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Estadísticas de progreso obtenidas exitosamente',
      data: {
        period,
        startDate,
        endDate: new Date(),
        stats
      }
    });

  } catch (error) {
    console.error('Error en getProgressStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

