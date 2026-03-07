import { Document, Schema, model } from 'mongoose';

export type RecurringExpenseType =
  | 'insurance'
  | 'subscription'
  | 'rent'
  | 'premium'
  | 'bill'
  | 'recharge'
  | 'other';
export type RecurringExpenseFrequency = 'monthly' | 'yearly';

export interface IRecurringExpense extends Document {
  userId: Schema.Types.ObjectId;
  name: string;
  type: RecurringExpenseType;
  frequency: RecurringExpenseFrequency;
  amount: number;
  dueDayOfMonth: number;
  dueMonth?: number;
  isMandatory: boolean;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recurringExpenseSchema = new Schema<IRecurringExpense>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'users' },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['insurance', 'subscription', 'rent', 'premium', 'bill', 'recharge', 'other'],
    },
    frequency: {
      type: String,
      required: true,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    amount: { type: Number, required: true, min: 0 },
    dueDayOfMonth: { type: Number, required: true, min: 1, max: 31 },
    dueMonth: { type: Number, min: 1, max: 12 },
    isMandatory: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

recurringExpenseSchema.index({ userId: 1, isActive: 1, createdAt: -1 });

export const RecurringExpenseModel = model<IRecurringExpense>(
  'expense_recurring',
  recurringExpenseSchema,
);
