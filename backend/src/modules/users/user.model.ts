import { Document, Schema, model } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  status: 'active' | 'disabled';
  fullName?: string;
  occupation?: string;
  location?: string;
  familySize?: number;
  monthlySalaryApprox?: number;
  variableExpenseBaseline?: number;
  onboardingCompleted: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active', required: true },
    fullName: { type: String, trim: true },
    occupation: { type: String, trim: true },
    location: { type: String, trim: true },
    familySize: { type: Number, min: 1, max: 20 },
    monthlySalaryApprox: { type: Number, min: 0 },
    variableExpenseBaseline: { type: Number, min: 0 },
    onboardingCompleted: { type: Boolean, default: false, required: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const UserModel = model<IUser>('users', userSchema);
