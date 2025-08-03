import { Request, Response } from 'express';
import { User } from '../models/User';
import { DietPlan } from '../models/DietPlan';
import { WorkoutPlan } from '../models/WorkoutPlan';
import { ProgressLog } from '../models/ProgressLog';
import { UserRole, IUser } from '../types';

/**
 * Obtener lista de clientes del entrenador autenticado
 */
export const getClients = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    // Verificar que el usuario sea entrenador
    if (req.user.role !== UserRole.TRAINER) {
      res.status(403).json({
        success: false,
        message: 'Solo los entrenadores pueden acceder a la lista de clientes',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Parámetros de paginación y filtrado
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Construir query de búsqueda
    const searchQuery: any = {
      trainerId: req.user.id,
      isActive: true
    };

    if (search) {
      searchQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Construir sort object
    const sortObject: any = {};
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Ejecutar consulta con paginación
    const skip = (page - 1) * limit;
    const clients = await User.find(searchQuery)
      .select('-password')
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .lean();

    // Contar total de documentos
    const total = await User.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);

    // Obtener información adicional para cada cliente
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        // Asegurarse de que client es del tipo IUser para acceder a los métodos
        const typedClient = client as unknown as IUser;

        // Obtener último registro de progreso
        const lastProgress = await ProgressLog.findOne({ userId: typedClient._id })
          .sort({ date: -1 })
          .select('date weight bodyFat mood energyLevel')
          .lean();

        // Verificar si tiene planes activos
        const [activeDietPlan, activeWorkoutPlan] = await Promise.all([
          DietPlan.findOne({ userId: typedClient._id, isActive: true }).select('title').lean(),
          WorkoutPlan.findOne({ userId: typedClient._id, isActive: true }).select('title').lean()
        ]);

        // Calcular fullName, age y bmi manualmente ya que estamos usando .lean()
        const fullName = `${typedClient.firstName || ''} ${typedClient.lastName || ''}`.trim();
        
        let age = null;
        if (typedClient.dateOfBirth) {
          const today = new Date();
          const birthDate = new Date(typedClient.dateOfBirth);
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        
        let bmi = null;
        if (typedClient.weight && typedClient.height) {
          const heightInMeters = typedClient.height / 100;
          bmi = (typedClient.weight / (heightInMeters * heightInMeters)).toFixed(1);
        }

        return {
          ...typedClient,
          fullName,
          age,
          bmi,
          lastProgress,
          activePlans: {
            diet: activeDietPlan?.title || null,
            workout: activeWorkoutPlan?.title || null
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Lista de clientes obtenida exitosamente',
      data: clientsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error en getClients:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Obtener información detallada de un cliente específico
 */
export const getClientById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const { clientId } = req.params;

    // Buscar cliente
    const client = await User.findById(clientId)
      .select('-password')
      .lean();

    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Cliente no encontrado',
        error: 'CLIENT_NOT_FOUND'
      });
      return;
    }

    // Asegurarse de que client es del tipo IUser para acceder a los métodos
    const typedClient = client as unknown as IUser;

    // Verificar que el cliente pertenezca al entrenador
    if (req.user.role === UserRole.TRAINER && typedClient.trainerId?.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este cliente',
        error: 'NOT_YOUR_CLIENT'
      });
      return;
    }

    // Obtener planes activos
    const [activeDietPlan, activeWorkoutPlan] = await Promise.all([
      DietPlan.findOne({ userId: clientId, isActive: true }).lean(),
      WorkoutPlan.findOne({ userId: clientId, isActive: true }).lean()
    ]);

    // Obtener últimos registros de progreso (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentProgress = await ProgressLog.find({
      userId: clientId,
      date: { $gte: thirtyDaysAgo }
    })
    .sort({ date: -1 })
    .limit(10)
    .lean();

    // Calcular estadísticas de progreso
    const progressStats = await ProgressLog.aggregate([
      {
        $match: {
          userId: typedClient._id,
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          avgWeight: { $avg: '$weight' },
          avgBodyFat: { $avg: '$bodyFat' },
          avgMood: { $avg: '$mood' },
          avgEnergyLevel: { $avg: '$energyLevel' },
          avgSleepHours: { $avg: '$sleepHours' },
          totalWorkouts: {
            $sum: {
              $cond: [{ $ifNull: ['$workoutCompleted', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Calcular fullName, age y bmi manualmente ya que estamos usando .lean()
    const fullName = `${typedClient.firstName || ''} ${typedClient.lastName || ''}`.trim();
    
    let age = null;
    if (typedClient.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(typedClient.dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    let bmi = null;
    if (typedClient.weight && typedClient.height) {
      const heightInMeters = typedClient.height / 100;
      bmi = (typedClient.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    // Preparar respuesta
    const clientDetails = {
      ...typedClient,
      fullName,
      age,
      bmi,
      activePlans: {
        diet: activeDietPlan,
        workout: activeWorkoutPlan
      },
      recentProgress,
      progressStats: progressStats[0] || {
        totalLogs: 0,
        avgWeight: null,
        avgBodyFat: null,
        avgMood: null,
        avgEnergyLevel: null,
        avgSleepHours: null,
        totalWorkouts: 0
      }
    };

    res.status(200).json({
      success: true,
      message: 'Información del cliente obtenida exitosamente',
      data: clientDetails
    });

  } catch (error) {
    console.error('Error en getClientById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Asignar un cliente a un entrenador
 */
export const assignClient = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    // Solo entrenadores pueden asignar clientes
    if (req.user.role !== UserRole.TRAINER) {
      res.status(403).json({
        success: false,
        message: 'Solo los entrenadores pueden asignar clientes',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    const { clientId } = req.params;

    // Buscar cliente
    const client = await User.findById(clientId);

    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Cliente no encontrado',
        error: 'CLIENT_NOT_FOUND'
      });
      return;
    }

    // Verificar que el usuario sea realmente un cliente
    if (client.role !== UserRole.USER) {
      res.status(400).json({
        success: false,
        message: 'Solo se pueden asignar usuarios con rol USER',
        error: 'NOT_A_CLIENT'
      });
      return;
    }

    // Verificar si ya tiene entrenador
    if (client.trainerId) {
      res.status(400).json({
        success: false,
        message: 'El cliente ya tiene un entrenador asignado',
        error: 'CLIENT_ALREADY_ASSIGNED'
      });
      return;
    }

    // Asignar entrenador al cliente
    client.trainerId = req.user.id as any; // Cast a any para evitar error de tipo con ObjectId
    await client.save();

    // Agregar cliente a la lista del entrenador
    await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { clients: clientId } }
    );

    res.status(200).json({
      success: true,
      message: 'Cliente asignado exitosamente',
      data: {
        clientId: client._id,
        clientName: `${client.firstName} ${client.lastName}`,
        trainerId: req.user.id,
        trainerName: `${req.user.firstName} ${req.user.lastName}`
      }
    });

  } catch (error) {
    console.error('Error en assignClient:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Desasignar un cliente de un entrenador
 */
export const unassignClient = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    // Solo entrenadores pueden desasignar clientes
    if (req.user.role !== UserRole.TRAINER) {
      res.status(403).json({
        success: false,
        message: 'Solo los entrenadores pueden desasignar clientes',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    const { clientId } = req.params;

    // Buscar cliente
    const client = await User.findById(clientId);

    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Cliente no encontrado',
        error: 'CLIENT_NOT_FOUND'
      });
      return;
    }

    // Verificar que el cliente pertenezca al entrenador
    if (client.trainerId?.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para desasignar este cliente',
        error: 'NOT_YOUR_CLIENT'
      });
      return;
    }

    // Desasignar entrenador del cliente
    client.trainerId = null as any;
    await client.save();

    // Remover cliente de la lista del entrenador
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { clients: clientId } }
    );

    // Desactivar planes activos del cliente
    await Promise.all([
      DietPlan.updateMany(
        { userId: clientId, isActive: true },
        { isActive: false }
      ),
      WorkoutPlan.updateMany(
        { userId: clientId, isActive: true },
        { isActive: false }
      )
    ]);

    res.status(200).json({
      success: true,
      message: 'Cliente desasignado exitosamente',
      data: {
        clientId: client._id,
        clientName: `${client.firstName} ${client.lastName}`
      }
    });

  } catch (error) {
    console.error('Error en unassignClient:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Obtener resumen de estadísticas de todos los clientes del entrenador
 */
export const getClientsStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    // Solo entrenadores pueden ver estadísticas
    if (req.user.role !== UserRole.TRAINER) {
      res.status(403).json({
        success: false,
        message: 'Solo los entrenadores pueden ver estadísticas de clientes',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // Obtener estadísticas generales
    const stats = await User.aggregate([
      {
        $match: {
          trainerId: req.user.id,
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalClients: { $sum: 1 },
          avgAge: {
            $avg: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                365.25 * 24 * 60 * 60 * 1000
              ]
            }
          },
          avgWeight: { $avg: '$weight' },
          avgHeight: { $avg: '$height' },
          genderDistribution: {
            $push: '$gender'
          },
          goalDistribution: {
            $push: '$goals'
          }
        }
      }
    ]);

    // Obtener estadísticas de planes activos
    const [activeDietPlans, activeWorkoutPlans] = await Promise.all([
      DietPlan.countDocuments({ trainerId: req.user.id, isActive: true }),
      WorkoutPlan.countDocuments({ trainerId: req.user.id, isActive: true })
    ]);

    // Obtener actividad reciente (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await ProgressLog.countDocuments({
      userId: { 
        $in: await User.find({ trainerId: req.user.id }).distinct('_id')
      },
      date: { $gte: sevenDaysAgo }
    });

    const statsData = {
      totalClients: stats[0]?.totalClients || 0,
      avgAge: stats[0]?.avgAge ? Math.round(stats[0].avgAge) : null,
      avgWeight: stats[0]?.avgWeight ? Math.round(stats[0].avgWeight * 10) / 10 : null,
      avgHeight: stats[0]?.avgHeight ? Math.round(stats[0].avgHeight) : null,
      activePlans: {
        diet: activeDietPlans,
        workout: activeWorkoutPlans
      },
      recentActivity,
      genderDistribution: stats[0]?.genderDistribution ? 
        stats[0].genderDistribution.reduce((acc: { [key: string]: number }, gender: string) => {
          acc[gender] = (acc[gender] || 0) + 1;
          return acc;
        }, {}) : {},
      goalDistribution: stats[0]?.goalDistribution ? 
        stats[0].goalDistribution.flat().reduce((acc: { [key: string]: number }, goal: string) => {
          acc[goal] = (acc[goal] || 0) + 1;
          return acc;
        }, {}) : {}
    };

    res.status(200).json({
      success: true,
      message: 'Estadísticas de clientes obtenidas exitosamente',
      data: statsData
    });

  } catch (error) {
    console.error('Error en getClientsStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};


