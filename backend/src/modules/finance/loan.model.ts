import { Document, Schema, model, models, type Model } from 'mongoose';

export type LoanType =
  | 'home'
  | 'personal'
  | 'vehicle'
  | 'education'
  | 'business'
  | 'gold'
  | 'credit-card'
  | 'other';

export type LoanPaymentMode = 'monthly' | 'yearly';

export interface ILoanEntry extends Document {
  userId: Schema.Types.ObjectId;
  loanType: LoanType;
  loanName: string;
  lenderName: string;
  principalAmount: number;
  outstandingAmount?: number;
  interestRate?: number;
  tenureMonths: number;
  emiAmount: number;
  paymentMode: LoanPaymentMode;
  paymentDueDate: Date;
  dueDayOfMonth?: number;
  loanStartDate?: Date;
  loanEndDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoanEntry>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'users' },
    loanType: {
      type: String,
      required: true,
      enum: ['home', 'personal', 'vehicle', 'education', 'business', 'gold', 'credit-card', 'other'],
    },
    loanName: { type: String, required: true, trim: true },
    lenderName: { type: String, required: true, trim: true },
    principalAmount: { type: Number, required: true, min: 0 },
    outstandingAmount: { type: Number, min: 0 },
    interestRate: { type: Number, min: 0 },
    tenureMonths: { type: Number, required: true, min: 1 },
    emiAmount: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, required: true, enum: ['monthly', 'yearly'], default: 'monthly' },
    paymentDueDate: { type: Date, required: true },
    dueDayOfMonth: { type: Number, min: 1, max: 31 },
    loanStartDate: { type: Date },
    loanEndDate: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false, collection: 'loan_entries' },
);

loanSchema.index({ userId: 1, createdAt: -1 });

export const LoanEntryModel =
  (models.finance_loan_entries as Model<ILoanEntry> | undefined) ??
  model<ILoanEntry>('finance_loan_entries', loanSchema, 'loan_entries');
