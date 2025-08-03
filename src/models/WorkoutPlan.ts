import { Schema, model } from 'mongoose';
import { IWorkoutPlan, IExercise, IWorkoutSet, IWorkoutExercise, IWorkout, ExerciseType, WorkoutCategory } from '../types';

const exerciseSchema = new Schema<IExercise>({
  name: {
    type: String,
    required: [true, 'El nombre del ejercicio es requerido'],
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(ExerciseType),
    required: [true, 'El tipo de ejercicio es requerido']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  instructions: [{
    type: String,
    trim: true
  }],
  targetMuscles: [{
    type: String,
    required: [true, 'Al menos un músculo objetivo es requerido'],
    trim: true
  }],
  equipment: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'La dificultad es requerida'],
    default: 'beginner'
  }
}, { _id: false });

const workoutSetSchema = new Schema<IWorkoutSet>({
  reps: {
    type: Number,
    min: [1, 'Las repeticiones deben ser al menos 1']
  },
  weight: {
    type: Number,
    min: [0, 'El peso no puede ser negativo']
  },
  duration: {
    type: Number,
    min: [1, 'La duración debe ser al menos 1 segundo']
  },
  distance: {
    type: Number,
    min: [1, 'La distancia debe ser al menos 1 metro']
  },
  restTime: {
    type: Number,
    min: [0, 'El tiempo de descanso no puede ser negativo'],
    default: 60
  }
}, { _id: false });

const workoutExerciseSchema = new Schema<IWorkoutExercise>({
  exercise: {
    type: exerciseSchema,
    required: [true, 'El ejercicio es requerido']
  },
  sets: [{
    type: workoutSetSchema,
    required: [true, 'Al menos una serie es requerida']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Las notas no pueden exceder 300 caracteres']
  }
}, { _id: false });

const workoutSchema = new Schema<IWorkout>({
  name: {
    type: String,
    required: [true, 'El nombre del entrenamiento es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  category: {
    type: String,
    enum: Object.values(WorkoutCategory),
    required: [true, 'La categoría del entrenamiento es requerida']
  },
  exercises: [{
    type: workoutExerciseSchema,
    required: [true, 'Al menos un ejercicio es requerido']
  }],
  estimatedDuration: {
    type: Number,
    required: [true, 'La duración estimada es requerida'],
    min: [5, 'La duración estimada debe ser al menos 5 minutos'],
    max: [300, 'La duración estimada no puede exceder 300 minutos']
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'La dificultad es requerida'],
    default: 'beginner'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  }
}, { _id: true });

const workoutPlanSchema = new Schema<IWorkoutPlan>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es requerido']
  },
  trainerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del entrenador es requerido']
  },
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  workouts: [{
    type: workoutSchema,
    required: [true, 'Al menos un entrenamiento es requerido']
  }],
  schedule: [{
    dayOfWeek: {
      type: Number,
      required: [true, 'El día de la semana es requerido'],
      min: [0, 'El día de la semana debe estar entre 0 y 6'],
      max: [6, 'El día de la semana debe estar entre 0 y 6']
    },
    workoutIndex: {
      type: Number,
      required: [true, 'El índice del entrenamiento es requerido'],
      min: [0, 'El índice del entrenamiento no puede ser negativo']
    }
  }],
  startDate: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida'],
    default: Date.now
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(this: IWorkoutPlan, value: Date) {
        return !value || value > this.startDate;
      },
      message: 'La fecha de fin debe ser posterior a la fecha de inicio'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
workoutPlanSchema.index({ userId: 1 });
workoutPlanSchema.index({ trainerId: 1 });
workoutPlanSchema.index({ isActive: 1 });
workoutPlanSchema.index({ startDate: -1 });
workoutPlanSchema.index({ userId: 1, isActive: 1 });

// Virtual for total weekly workouts
workoutPlanSchema.virtual('weeklyWorkouts').get(function() {
  return this.schedule.length;
});

// Virtual for plan duration in days
workoutPlanSchema.virtual('durationDays').get(function() {
  if (!this.endDate) return null;
  
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total exercises count
workoutPlanSchema.virtual('totalExercises').get(function() {
  return this.workouts.reduce((total: number, workout: IWorkout) => total + workout.exercises.length, 0);
});

// Virtual for average workout duration
workoutPlanSchema.virtual('averageWorkoutDuration').get(function() {
  if (this.workouts.length === 0) return 0;
  
  const totalDuration = this.workouts.reduce((total: number, workout: IWorkout) => total + workout.estimatedDuration, 0);
  return Math.round(totalDuration / this.workouts.length);
});

// Virtual for muscle groups targeted
workoutPlanSchema.virtual('targetedMuscleGroups').get(function() {
  const muscleGroups = new Set<string>();
  
  this.workouts.forEach((workout: IWorkout) => {
    workout.exercises.forEach((exercise: IWorkoutExercise) => {
      exercise.exercise.targetMuscles.forEach((muscle: string) => {
        muscleGroups.add(muscle.toLowerCase());
      });
    });
  });
  
  return Array.from(muscleGroups);
});

// Virtual for workout categories in the plan
workoutPlanSchema.virtual('workoutCategories').get(function() {
  const categories = new Set<string>();
  
  this.workouts.forEach((workout: IWorkout) => {
    categories.add(workout.category);
  });
  
  return Array.from(categories);
});

// Virtual for strength workouts count
workoutPlanSchema.virtual('strengthWorkoutsCount').get(function() {
  return this.workouts.filter((workout: IWorkout) => 
    workout.category.startsWith('STRENGTH_')
  ).length;
});

// Virtual for cardio workouts count
workoutPlanSchema.virtual('cardioWorkoutsCount').get(function() {
  return this.workouts.filter((workout: IWorkout) => 
    workout.category === 'CARDIO'
  ).length;
});

// Virtual for flexibility workouts count
workoutPlanSchema.virtual('flexibilityWorkoutsCount').get(function() {
  return this.workouts.filter((workout: IWorkout) => 
    workout.category === 'FLEXIBILITY'
  ).length;
});

// Pre-validate middleware to check schedule workout indexes
workoutPlanSchema.pre('validate', function(next) {
  const maxWorkoutIndex = this.workouts.length - 1;
  
  for (const scheduleItem of this.schedule) {
    if (scheduleItem.workoutIndex > maxWorkoutIndex) {
      return next(new Error(`El índice del entrenamiento ${scheduleItem.workoutIndex} excede el número de entrenamientos disponibles (${this.workouts.length})`));
    }
  }
  
  next();
});

// Static method to find active plans for a user
workoutPlanSchema.statics.findActiveByUser = function(userId: string) {
  return this.findOne({ userId, isActive: true })
    .populate('userId', 'firstName lastName email')
    .populate('trainerId', 'firstName lastName email');
};

// Static method to find plans by trainer
workoutPlanSchema.statics.findByTrainer = function(trainerId: string) {
  return this.find({ trainerId })
    .populate('userId', 'firstName lastName email profilePicture')
    .sort({ updatedAt: -1 });
};

// Instance method to check if plan is current
workoutPlanSchema.methods.isCurrent = function(): boolean {
  const now = new Date();
  const isAfterStart = now >= this.startDate;
  const isBeforeEnd = !this.endDate || now <= this.endDate;
  
  return this.isActive && isAfterStart && isBeforeEnd;
};

// Instance method to get workout for specific day
workoutPlanSchema.methods.getWorkoutForDay = function(dayOfWeek: number): IWorkout | null {
  const scheduleItem = this.schedule.find((item: { dayOfWeek: number; workoutIndex: number; }) => item.dayOfWeek === dayOfWeek);
  
  if (!scheduleItem || scheduleItem.workoutIndex >= this.workouts.length) {
    return null;
  }
  
  return this.workouts[scheduleItem.workoutIndex];
};

// Instance method to get today's workout
workoutPlanSchema.methods.getTodaysWorkout = function(): IWorkout | null {
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  return this.getWorkoutForDay(today);
};

// Instance method to calculate total weekly duration
workoutPlanSchema.methods.getWeeklyDuration = function(): number {
  return this.schedule.reduce((total: number, scheduleItem: { dayOfWeek: number; workoutIndex: number; }) => {
    const workout = this.workouts[scheduleItem.workoutIndex];
    return total + (workout ? workout.estimatedDuration : 0);
  }, 0);
};

// Instance method to get workouts by category
workoutPlanSchema.methods.getWorkoutsByCategory = function(category: string): IWorkout[] {
  return this.workouts.filter((workout: IWorkout) => workout.category === category);
};

// Instance method to get strength workouts
workoutPlanSchema.methods.getStrengthWorkouts = function(): IWorkout[] {
  return this.workouts.filter((workout: IWorkout) => workout.category.startsWith('STRENGTH_'));
};

// Instance method to get cardio workouts
workoutPlanSchema.methods.getCardioWorkouts = function(): IWorkout[] {
  return this.workouts.filter((workout: IWorkout) => workout.category === 'CARDIO');
};

// Instance method to get flexibility workouts
workoutPlanSchema.methods.getFlexibilityWorkouts = function(): IWorkout[] {
  return this.workouts.filter((workout: IWorkout) => workout.category === 'FLEXIBILITY');
};

// Instance method to get workout for specific day and category
workoutPlanSchema.methods.getWorkoutForDayAndCategory = function(dayOfWeek: number, category: string): IWorkout | null {
  const scheduleItem = this.schedule.find((item: { dayOfWeek: number; workoutIndex: number; }) => item.dayOfWeek === dayOfWeek);
  
  if (!scheduleItem || scheduleItem.workoutIndex >= this.workouts.length) {
    return null;
  }
  
  const workout = this.workouts[scheduleItem.workoutIndex];
  return workout.category === category ? workout : null;
};

export const WorkoutPlan = model<IWorkoutPlan>('WorkoutPlan', workoutPlanSchema);


