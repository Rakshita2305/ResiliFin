import { Document, Schema, model } from 'mongoose';

export interface IProfile extends Document {
  userId: Schema.Types.ObjectId;
  fullName?: string;
  age?: number;
  occupation?: string;
  location?: string;
  familySize?: number;
  preferredBanks: string[];
  monthlySalaryApprox?: number;
  monthlyFixedExpense?: number;
  variableExpenseBaseline?: number;
  liquidSavings?: number;
  emergencyFund?: number;
  extendedSavingsTotal?: number;
  monthlyExpenseInputMode?: 'approx' | 'statement' | 'hybrid';
  statementUploadRecommended?: boolean;
  paymentSchedules: Array<{
    kind: 'emi' | 'bill' | 'recharge' | 'investment' | 'insurance';
    dueDayOfMonth: number;
    amount?: number;
    autoPay?: boolean;
  }>;
  currency: 'INR';
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true, ref: 'users' },
    fullName: { type: String, trim: true },
    age: { type: Number, min: 1, max: 120 },
    occupation: { type: String, trim: true },
    location: { type: String, trim: true },
    familySize: { type: Number, min: 1, max: 20 },
    preferredBanks: { type: [String], default: [] },
    monthlySalaryApprox: { type: Number, min: 0 },
    monthlyFixedExpense: { type: Number, min: 0 },
    variableExpenseBaseline: { type: Number, min: 0 },
    liquidSavings: { type: Number, min: 0 },
    emergencyFund: { type: Number, min: 0 },
    extendedSavingsTotal: { type: Number, min: 0 },
    monthlyExpenseInputMode: { type: String, enum: ['approx', 'statement', 'hybrid'], default: 'approx' },
    statementUploadRecommended: { type: Boolean, default: true },
    paymentSchedules: {
      type: [
        new Schema(
          {
            kind: {
              type: String,
              enum: ['emi', 'bill', 'recharge', 'investment', 'insurance'],
              required: true,
            },
            dueDayOfMonth: { type: Number, min: 1, max: 31, required: true },
            amount: { type: Number, min: 0 },
            autoPay: { type: Boolean, default: false },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    currency: { type: String, enum: ['INR'], default: 'INR', required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ProfileModel = model<IProfile>('profiles', profileSchema);
