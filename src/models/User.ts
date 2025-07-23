import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, ActivityLevel, Goal } from '../types';

// Extend the Mongoose Document interface to include our custom methods
interface IUserDocument extends Document {
  email: string;
  password?: string; // Make password optional for Document, as it's selected false by default
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
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  getAge(): number | undefined;
  getBMI(): number | undefined;
}

const userSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No incluir la contraseña en las consultas por defecto
  },
  firstName: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  lastName: {
    type: String,
    required: [true, 'El apellido es requerido'],
    trim: true,
    maxlength: [50, 'El apellido no puede exceder 50 caracteres']
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: [true, 'El rol es requerido'],
    default: UserRole.USER
  },
  profilePicture: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value: Date) {
        return !value || value < new Date();
      },
      message: 'La fecha de nacimiento debe ser anterior a hoy'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: null
  },
  height: {
    type: Number,
    min: [50, 'La altura debe ser mayor a 50 cm'],
    max: [300, 'La altura debe ser menor a 300 cm'],
    default: null
  },
  weight: {
    type: Number,
    min: [20, 'El peso debe ser mayor a 20 kg'],
    max: [500, 'El peso debe ser menor a 500 kg'],
    default: null
  },
  activityLevel: {
    type: String,
    enum: Object.values(ActivityLevel),
    default: null
  },
  goals: [{
    type: String,
    enum: Object.values(Goal)
  }],
  medicalConditions: [{
    type: String,
    trim: true
  }],
  allergies: [{
    type: String,
    trim: true
  }],
  trainerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    required: false
  },
  clients: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Asegurarse de que 'password' no se envíe en la respuesta JSON
      delete (ret as any).password;
      delete (ret as any).__v;
      return ret;
    },
    virtuals: true // Asegura que los virtuales se incluyan en JSON
  },
  toObject: {
    transform: function(doc, ret) {
      // Asegurarse de que 'password' no se envíe en la respuesta Object
      delete (ret as any).password;
      delete (ret as any).__v;
      return ret;
    },
    virtuals: true // Asegura que los virtuales se incluyan en Object
  }
});

// Indexes for better performance
userSchema.index({ role: 1 });
userSchema.index({ trainerId: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!(this as any).isModified('password')) return next();

  try {
    // Cast this.password to string as it's guaranteed to be a string here
    const hashedPassword = await bcrypt.hash((this as any).password as string, 12);
    (this as any).password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    // 'this.password' will be available here because we explicitly select it in login/changePassword
    return await bcrypt.compare(candidatePassword, (this as any).password as string);
  } catch (error) {
    throw error;
  }
};

// Instance method to get full name
userSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

// Instance method to calculate age
userSchema.methods.getAge = function(): number | undefined {
  if (!this.dateOfBirth) return undefined;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Instance method to calculate BMI
userSchema.methods.getBMI = function(): number | undefined {
  if (!this.weight || !this.height) return undefined;
  
  const heightInMeters = this.height / 100;
  return Number((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
};

// Static method to find users by role
userSchema.statics.findByRole = function(role: UserRole) {
  return this.find({ role, isActive: true });
};

// Static method to find trainer's clients
userSchema.statics.findTrainerClients = function(trainerId: string) {
  return this.find({ trainerId, isActive: true });
};

// Virtual for client count (for trainers)
userSchema.virtual('clientCount').get(function(this: IUserDocument) {
  return this.clients ? this.clients.length : 0;
});

export const User = model<IUserDocument>('User', userSchema);


