import { Schema, model } from 'mongoose';
import { IProgressLog } from '../types';

const measurementsSchema = new Schema({
  chest: {
    type: Number,
    min: [50, 'La medida del pecho debe ser al menos 50 cm'],
    max: [200, 'La medida del pecho no puede exceder 200 cm']
  },
  waist: {
    type: Number,
    min: [40, 'La medida de la cintura debe ser al menos 40 cm'],
    max: [200, 'La medida de la cintura no puede exceder 200 cm']
  },
  hips: {
    type: Number,
    min: [50, 'La medida de las caderas debe ser al menos 50 cm'],
    max: [200, 'La medida de las caderas no puede exceder 200 cm']
  },
  arms: {
    type: Number,
    min: [15, 'La medida de los brazos debe ser al menos 15 cm'],
    max: [80, 'La medida de los brazos no puede exceder 80 cm']
  },
  thighs: {
    type: Number,
    min: [30, 'La medida de los muslos debe ser al menos 30 cm'],
    max: [100, 'La medida de los muslos no puede exceder 100 cm']
  },
  neck: {
    type: Number,
    min: [25, 'La medida del cuello debe ser al menos 25 cm'],
    max: [60, 'La medida del cuello no puede exceder 60 cm']
  }
}, { _id: false });

const workoutCompletedSchema = new Schema({
  workoutId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkoutPlan'
  },
  duration: {
    type: Number,
    required: [true, 'La duración del entrenamiento es requerida'],
    min: [1, 'La duración debe ser al menos 1 minuto'],
    max: [600, 'La duración no puede exceder 600 minutos']
  },
  caloriesBurned: {
    type: Number,
    min: [0, 'Las calorías quemadas no pueden ser negativas'],
    max: [3000, 'Las calorías quemadas no pueden exceder 3000']
  },
  exercises: [{
    exerciseName: {
      type: String,
      required: [true, 'El nombre del ejercicio es requerido'],
      trim: true
    },
    setsCompleted: {
      type: Number,
      required: [true, 'El número de series completadas es requerido'],
      min: [0, 'Las series completadas no pueden ser negativas'],
      max: [50, 'Las series completadas no pueden exceder 50']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Las notas no pueden exceder 200 caracteres']
    }
  }]
}, { _id: false });

const nutritionLogSchema = new Schema({
  mealsLogged: {
    type: Number,
    required: [true, 'El número de comidas registradas es requerido'],
    min: [0, 'Las comidas registradas no pueden ser negativas'],
    max: [10, 'Las comidas registradas no pueden exceder 10']
  },
  totalCalories: {
    type: Number,
    required: [true, 'Las calorías totales son requeridas'],
    min: [0, 'Las calorías totales no pueden ser negativas'],
    max: [10000, 'Las calorías totales no pueden exceder 10000']
  },
  totalProtein: {
    type: Number,
    required: [true, 'La proteína total es requerida'],
    min: [0, 'La proteína total no puede ser negativa'],
    max: [500, 'La proteína total no puede exceder 500g']
  },
  totalCarbs: {
    type: Number,
    required: [true, 'Los carbohidratos totales son requeridos'],
    min: [0, 'Los carbohidratos totales no pueden ser negativos'],
    max: [1000, 'Los carbohidratos totales no pueden exceder 1000g']
  },
  totalFat: {
    type: Number,
    required: [true, 'Las grasas totales son requeridas'],
    min: [0, 'Las grasas totales no pueden ser negativas'],
    max: [300, 'Las grasas totales no pueden exceder 300g']
  }
}, { _id: false });

const progressLogSchema = new Schema<IProgressLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es requerido']
  },
  date: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    default: Date.now,
    validate: {
      validator: function(value: Date) {
        return value <= new Date();
      },
      message: 'La fecha no puede ser futura'
    }
  },
  weight: {
    type: Number,
    min: [20, 'El peso debe ser mayor a 20 kg'],
    max: [500, 'El peso debe ser menor a 500 kg']
  },
  bodyFat: {
    type: Number,
    min: [1, 'El porcentaje de grasa corporal debe ser al menos 1%'],
    max: [60, 'El porcentaje de grasa corporal no puede exceder 60%']
  },
  muscleMass: {
    type: Number,
    min: [10, 'La masa muscular debe ser al menos 10 kg'],
    max: [200, 'La masa muscular no puede exceder 200 kg']
  },
  measurements: measurementsSchema,
  photos: [{
    type: String,
    validate: {
      validator: function(value: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value);
      },
      message: 'La URL de la foto debe ser válida y terminar en .jpg, .jpeg, .png, .gif o .webp'
    }
  }],
  mood: {
    type: Number,
    min: [1, 'El estado de ánimo debe estar entre 1 y 10'],
    max: [10, 'El estado de ánimo debe estar entre 1 y 10']
  },
  energyLevel: {
    type: Number,
    min: [1, 'El nivel de energía debe estar entre 1 y 10'],
    max: [10, 'El nivel de energía debe estar entre 1 y 10']
  },
  sleepHours: {
    type: Number,
    min: [0, 'Las horas de sueño no pueden ser negativas'],
    max: [24, 'Las horas de sueño no pueden exceder 24']
  },
  waterIntake: {
    type: Number,
    min: [0, 'El consumo de agua no puede ser negativo'],
    max: [10, 'El consumo de agua no puede exceder 10 litros']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres']
  },
  workoutCompleted: workoutCompletedSchema,
  nutritionLog: nutritionLogSchema
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
progressLogSchema.index({ userId: 1 });
progressLogSchema.index({ date: -1 });
progressLogSchema.index({ userId: 1, date: -1 });
progressLogSchema.index({ createdAt: -1 });

// Compound index for user progress over time
progressLogSchema.index({ userId: 1, date: -1, weight: 1 });

// Virtual for BMI calculation
progressLogSchema.virtual('bmi').get(function() {
  if (!this.weight) return null;
  
  // We need to get height from the user document
  // This would typically be populated or calculated elsewhere
  return null; // Placeholder - would need user height
});

// Virtual for weight change from previous entry
progressLogSchema.virtual('weightChange').get(function() {
  // This would be calculated by comparing with previous entry
  // Implementation would require a separate method or pre-calculation
  return null; // Placeholder
});

// Virtual for total workout time this week
progressLogSchema.virtual('weeklyWorkoutTime').get(function() {
  // This would aggregate workout time for the current week
  // Implementation would require aggregation pipeline
  return null; // Placeholder
});

// Static method to find progress logs for a user within date range
progressLogSchema.statics.findByUserAndDateRange = function(
  userId: string, 
  startDate: Date, 
  endDate: Date
) {
  return this.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to find latest progress log for a user
progressLogSchema.statics.findLatestByUser = function(userId: string) {
  return this.findOne({ userId })
    .sort({ date: -1 })
    .populate('userId', 'firstName lastName email height');
};

// Static method to get progress summary for a user
progressLogSchema.statics.getProgressSummary = function(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: new Schema.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$userId',
        totalLogs: { $sum: 1 },
        avgWeight: { $avg: '$weight' },
        avgBodyFat: { $avg: '$bodyFat' },
        avgMood: { $avg: '$mood' },
        avgEnergyLevel: { $avg: '$energyLevel' },
        avgSleepHours: { $avg: '$sleepHours' },
        avgWaterIntake: { $avg: '$waterIntake' },
        totalWorkouts: {
          $sum: {
            $cond: [{ $ifNull: ['$workoutCompleted', false] }, 1, 0]
          }
        },
        totalWorkoutTime: { $sum: '$workoutCompleted.duration' }
      }
    }
  ]);
};

// Instance method to check if this is a workout day
progressLogSchema.methods.hasWorkout = function(): boolean {
  return !!this.workoutCompleted;
};

// Instance method to check if nutrition was logged
progressLogSchema.methods.hasNutritionLog = function(): boolean {
  return !!this.nutritionLog;
};

// Instance method to calculate completion score (0-100)
progressLogSchema.methods.getCompletionScore = function(): number {
  let score = 0;
  const maxScore = 100;
  
  // Weight logged (20 points)
  if (this.weight) score += 20;
  
  // Measurements logged (15 points)
  if (this.measurements && Object.keys(this.measurements.toObject()).length > 0) score += 15;
  
  // Mood and energy logged (10 points each)
  if (this.mood) score += 10;
  if (this.energyLevel) score += 10;
  
  // Sleep logged (10 points)
  if (this.sleepHours) score += 10;
  
  // Water intake logged (10 points)
  if (this.waterIntake) score += 10;
  
  // Workout completed (15 points)
  if (this.workoutCompleted) score += 15;
  
  // Nutrition logged (10 points)
  if (this.nutritionLog) score += 10;
  
  return Math.min(score, maxScore);
};

// Pre-save middleware to ensure only one log per user per day
progressLogSchema.pre('save', async function(next) {
  if (this.isNew) {
    const startOfDay = new Date(this.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(this.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingLog = await model('ProgressLog').findOne({
      userId: this.userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    if (existingLog) {
      return next(new Error('Ya existe un registro de progreso para este usuario en esta fecha'));
    }
  }
  
  next();
});

export const ProgressLog = model<IProgressLog>('ProgressLog', progressLogSchema);

