import { Document, Schema, model } from 'mongoose';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'rent'
  | 'utilities'
  | 'shopping'
  | 'entertainment'
  | 'subscription'
  | 'healthcare'
  | 'education'
  | 'other';

export interface IManualExpense extends Document {
  userId: Schema.Types.ObjectId;
  amount: number;
  category: ExpenseCategory;
  subCategory?: string;
  date: Date;
  paymentMode: 'cash' | 'upi' | 'card' | 'bank-transfer' | 'other';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const manualExpenseSchema = new Schema<IManualExpense>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'users' },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: [
        'food',
        'transport',
        'rent',
        'utilities',
        'shopping',
        'entertainment',
        'subscription',
        'healthcare',
        'education',
        'other',
      ],
    },
    subCategory: { type: String, trim: true },
    date: { type: Date, required: true, index: true },
    paymentMode: {
      type: String,
      required: true,
      enum: ['cash', 'upi', 'card', 'bank-transfer', 'other'],
      default: 'other',
    },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

manualExpenseSchema.index({ userId: 1, date: -1 });

export const ManualExpenseModel = model<IManualExpense>('expense_manual_entries', manualExpenseSchema);
