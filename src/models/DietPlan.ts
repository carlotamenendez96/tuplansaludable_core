import { Schema, model } from 'mongoose';
import { IDietPlan, IFood, IMeal, MealType } from '../types';

const foodSchema = new Schema<IFood>({
  name: {
    type: String,
    required: [true, 'El nombre del alimento es requerido'],
    trim: true
  },
  calories: {
    type: Number,
    required: [true, 'Las calorías son requeridas'],
    min: [0, 'Las calorías no pueden ser negativas']
  },
  protein: {
    type: Number,
    required: [true, 'La proteína es requerida'],
    min: [0, 'La proteína no puede ser negativa']
  },
  carbs: {
    type: Number,
    required: [true, 'Los carbohidratos son requeridos'],
    min: [0, 'Los carbohidratos no pueden ser negativos']
  },
  fat: {
    type: Number,
    required: [true, 'Las grasas son requeridas'],
    min: [0, 'Las grasas no pueden ser negativas']
  },
  fiber: {
    type: Number,
    min: [0, 'La fibra no puede ser negativa'],
    default: 0
  }
}, { _id: false });

const mealSchema = new Schema<IMeal>({
  type: {
    type: String,
    enum: Object.values(MealType),
    required: [true, 'El tipo de comida es requerido']
  },
  foods: [{
    food: {
      type: foodSchema,
      required: [true, 'El alimento es requerido']
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es requerida'],
      min: [1, 'La cantidad debe ser mayor a 0']
    }
  }],
  totalCalories: {
    type: Number,
    required: [true, 'Las calorías totales son requeridas'],
    min: [0, 'Las calorías totales no pueden ser negativas']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  }
}, { _id: false });

const dietPlanSchema = new Schema<IDietPlan>({
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
  targetCalories: {
    type: Number,
    required: [true, 'Las calorías objetivo son requeridas'],
    min: [800, 'Las calorías objetivo deben ser al menos 800'],
    max: [5000, 'Las calorías objetivo no pueden exceder 5000']
  },
  targetProtein: {
    type: Number,
    required: [true, 'La proteína objetivo es requerida'],
    min: [0, 'La proteína objetivo no puede ser negativa']
  },
  targetCarbs: {
    type: Number,
    required: [true, 'Los carbohidratos objetivo son requeridos'],
    min: [0, 'Los carbohidratos objetivo no pueden ser negativos']
  },
  targetFat: {
    type: Number,
    required: [true, 'Las grasas objetivo son requeridas'],
    min: [0, 'Las grasas objetivo no pueden ser negativas']
  },
  meals: [mealSchema],
  startDate: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida'],
    default: Date.now
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(this: IDietPlan, value: Date) {
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
dietPlanSchema.index({ userId: 1 });
dietPlanSchema.index({ trainerId: 1 });
dietPlanSchema.index({ isActive: 1 });
dietPlanSchema.index({ startDate: -1 });
dietPlanSchema.index({ userId: 1, isActive: 1 });

// Virtual for total daily macros from meals
dietPlanSchema.virtual('actualMacros').get(function() {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  };

  this.meals.forEach(meal => {
    meal.foods.forEach(foodItem => {
      const multiplier = foodItem.quantity / 100; // Convert to per gram
      totals.calories += foodItem.food.calories * multiplier;
      totals.protein += foodItem.food.protein * multiplier;
      totals.carbs += foodItem.food.carbs * multiplier;
      totals.fat += foodItem.food.fat * multiplier;
      totals.fiber += (foodItem.food.fiber || 0) * multiplier;
    });
  });

  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    fiber: Math.round(totals.fiber * 10) / 10
  };
});

// Virtual for macro distribution percentages
dietPlanSchema.virtual('macroDistribution').get(function() {
  const actualMacros = this.get('actualMacros') as { calories: number, protein: number, carbs: number, fat: number, fiber: number };
  const totalCalories = actualMacros.calories;

  if (totalCalories === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  return {
    protein: Math.round((actualMacros.protein * 4 / totalCalories) * 100),
    carbs: Math.round((actualMacros.carbs * 4 / totalCalories) * 100),
    fat: Math.round((actualMacros.fat * 9 / totalCalories) * 100)
  };
});

// Virtual for plan duration in days
dietPlanSchema.virtual('durationDays').get(function() {
  if (!this.endDate) return null;
  
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate total calories for each meal
mealSchema.pre('save', function(next) {
  let totalCalories = 0;
  
  this.foods.forEach(foodItem => {
    const multiplier = foodItem.quantity / 100;
    totalCalories += foodItem.food.calories * multiplier;
  });
  
  this.totalCalories = Math.round(totalCalories);
  next();
});

// Static method to find active plans for a user
dietPlanSchema.statics.findActiveByUser = function(userId: string) {
  return this.findOne({ userId, isActive: true })
    .populate('userId', 'firstName lastName email')
    .populate('trainerId', 'firstName lastName email');
};

// Static method to find plans by trainer
dietPlanSchema.statics.findByTrainer = function(trainerId: string) {
  return this.find({ trainerId })
    .populate('userId', 'firstName lastName email profilePicture')
    .sort({ updatedAt: -1 });
};

// Instance method to check if plan is current
dietPlanSchema.methods.isCurrent = function(): boolean {
  const now = new Date();
  const isAfterStart = now >= this.startDate;
  const isBeforeEnd = !this.endDate || now <= this.endDate;
  
  return this.isActive && isAfterStart && isBeforeEnd;
};

// Instance method to get meal by type
dietPlanSchema.methods.getMealByType = function(mealType: MealType): IMeal | null {
  return this.meals.find((meal: any) => meal.type === mealType) || null;
};

export const DietPlan = model<IDietPlan>('DietPlan', dietPlanSchema);

