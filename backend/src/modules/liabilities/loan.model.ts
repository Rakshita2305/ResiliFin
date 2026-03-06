import { Document, Schema, model } from 'mongoose';

export type LoanType = 'home' | 'car' | 'personal' | 'education' | 'credit-card' | 'other';

export interface ILoan extends Document {
  userId: Schema.Types.ObjectId;
  loanType: LoanType;
  lenderName: string;
  principalAmount: number;
  outstandingAmount: number;
  emiAmount: number;
  interestRate?: number;
  startDate: Date;
  dueDayOfMonth: number;
  tenureMonths?: number;
  isAutoPay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'users' },
    loanType: {
      type: String,
      required: true,
      enum: ['home', 'car', 'personal', 'education', 'credit-card', 'other'],
    },
    lenderName: { type: String, required: true, trim: true },
    principalAmount: { type: Number, required: true, min: 0 },
    outstandingAmount: { type: Number, required: true, min: 0 },
    emiAmount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, min: 0, max: 100 },
    startDate: { type: Date, required: true },
    dueDayOfMonth: { type: Number, required: true, min: 1, max: 31 },
    tenureMonths: { type: Number, min: 1 },
    isAutoPay: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

loanSchema.index({ userId: 1, createdAt: -1 });

export const LoanModel = model<ILoan>('loan_entries', loanSchema);
