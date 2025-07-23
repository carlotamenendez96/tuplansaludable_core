import { Document, Types } from 'mongoose';

// Enums
export enum UserRole {
  USER = 'USER',
  TRAINER = 'TRAINER'
}

export enum ActivityLevel {
  SEDENTARY = 'SEDENTARY',
  LIGHTLY_ACTIVE = 'LIGHTLY_ACTIVE',
  MODERATELY_ACTIVE = 'MODERATELY_ACTIVE',
  VERY_ACTIVE = 'VERY_ACTIVE',
  EXTREMELY_ACTIVE = 'EXTREMELY_ACTIVE'
}

export enum Goal {
  LOSE_WEIGHT = 'LOSE_WEIGHT',
  GAIN_WEIGHT = 'GAIN_WEIGHT',
  MAINTAIN_WEIGHT = 'MAINTAIN_WEIGHT',
  BUILD_MUSCLE = 'BUILD_MUSCLE',
  IMPROVE_FITNESS = 'IMPROVE_FITNESS'
}

export enum ExerciseType {
  CARDIO = 'CARDIO',
  STRENGTH = 'STRENGTH',
  FLEXIBILITY = 'FLEXIBILITY',
  BALANCE = 'BALANCE',
  SPORTS = 'SPORTS'
}

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK'
}

// Base interfaces
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password?: string; // Make password optional for type safety in some contexts
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePicture?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel?: ActivityLevel;
  goals?: Goal[];
  medicalConditions?: string[];
  allergies?: string[];
  trainerId?: Types.ObjectId | null; // Reference to trainer (if user is a client)
  clients?: Types.ObjectId[]; // Array of client IDs (if user is a trainer)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Métodos y propiedades adicionales del esquema de Mongoose
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  getAge(): number | undefined;
  getBMI(): number | undefined;
  clientCount?: number; // Propiedad virtual para entrenadores
}

export interface IFood {
  name: string;
  calories: number; // per 100g
  protein: number; // in grams per 100g
  carbs: number; // in grams per 100g
  fat: number; // in grams per 100g
  fiber?: number; // in grams per 100g
}

export interface IMeal {
  type: MealType;
  foods: {
    food: IFood;
    quantity: number; // in grams
  }[];
  totalCalories: number;
  notes?: string;
}

export interface IDietPlan extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  trainerId: Types.ObjectId;
  title: string;
  description?: string;
  targetCalories: number; // daily target
  targetProtein: number; // daily target in grams
  targetCarbs: number; // daily target in grams
  targetFat: number; // in grams per 100g
  meals: IMeal[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExercise {
  name: string;
  type: ExerciseType;
  description?: string;
  instructions?: string[];
  targetMuscles: string[];
  equipment?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface IWorkoutSet {
  reps?: number;
  weight?: number; // in kg
  duration?: number; // in seconds
  distance?: number; // in meters
  restTime?: number; // in seconds
}

export interface IWorkoutExercise {
  exercise: IExercise;
  sets: IWorkoutSet[];
  notes?: string;
}

export interface IWorkout {
  name: string;
  exercises: IWorkoutExercise[];
  estimatedDuration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  notes?: string;
}

export interface IWorkoutPlan extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  trainerId: Types.ObjectId;
  title: string;
  description?: string;
  workouts: IWorkout[];
  schedule: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    workoutIndex: number; // Index in workouts array
  }[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProgressLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  weight?: number; // in kg
  bodyFat?: number; // percentage
  muscleMass?: number; // in kg
  measurements?: {
    chest?: number; // in cm
    waist?: number; // in cm
    hips?: number; // in cm
    arms?: number; // in cm
    thighs?: number; // in cm
    neck?: number; // in cm
  };
  photos?: string[]; // URLs to progress photos
  mood?: number; // 1-10 scale
  energyLevel?: number; // 1-10 scale
  sleepHours?: number;
  waterIntake?: number; // in liters
  notes?: string;
  workoutCompleted?: {
    workoutId?: Types.ObjectId;
    duration: number;
    caloriesBurned?: number;
    exercises: {
      exerciseName: string;
      setsCompleted: number;
      notes?: string;
    }[];
  };
  nutritionLog?: {
    mealsLogged: number;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  message: string;
  messageType: 'text' | 'image' | 'file';
  attachments?: string[]; // URLs to attached files
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response interfaces
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    profilePicture?: string | undefined; // Make profilePicture explicitly string | undefined
  };
}

export interface IAuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

// API Response interfaces
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Validation schemas interfaces
export interface ICreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  activityLevel?: ActivityLevel;
  goals?: Goal[];
  medicalConditions?: string[];
  allergies?: string[];
  trainerId?: string;
}

export interface IUpdateDietPlanRequest {
  title?: string;
  description?: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  meals?: IMeal[];
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

export interface IUpdateWorkoutPlanRequest {
  title?: string;
  description?: string;
  workouts?: IWorkout[];
  schedule?: {
    dayOfWeek: number;
    workoutIndex: number;
  }[];
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

export interface ICreateProgressLogRequest {
  date: Date;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
    neck?: number;
  };
  mood?: number;
  energyLevel?: number;
  sleepHours?: number;
  waterIntake?: number;
  notes?: string;
  workoutCompleted?: {
    workoutId?: string;
    duration: number;
    caloriesBurned?: number;
    exercises: {
      exerciseName: string;
      setsCompleted: number;
      notes?: string;
    }[];
  };
  nutritionLog?: {
    mealsLogged: number;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
}

export interface ISendMessageRequest {
  message: string;
  messageType: 'text' | 'image' | 'file';
  attachments?: string[];
}





