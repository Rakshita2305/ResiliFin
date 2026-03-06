import { Document, Schema, model, models, type Model } from 'mongoose';

export type InsuranceType =
  | 'health'
  | 'life'
  | 'vehicle'
  | 'home'
  | 'travel'
  | 'term-life'
  | 'personal-accident'
  | 'gadget'
  | 'business-liability'
  | 'other';

export type InsurancePaymentMode = 'monthly' | 'yearly';

export interface IInsuranceEntry extends Document {
  userId: Schema.Types.ObjectId;
  type: InsuranceType;
  policyName: string;
  providerName: string;
  coverageAmount?: number;
  premiumAmount?: number;
  maxReturnAmount?: number;
  paymentMode: InsurancePaymentMode;
  paymentDate?: Date;
  premiumFrequency?: 'monthly' | 'quarterly' | 'yearly';
  policyStartDate?: Date;
  policyEndDate?: Date;
  nextDebitDate?: Date;
  renewalDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const insuranceSchema = new Schema<IInsuranceEntry>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'users' },
    type: {
      type: String,
      required: true,
      enum: [
        'health',
        'life',
        'vehicle',
        'home',
        'travel',
        'term-life',
        'personal-accident',
        'gadget',
        'business-liability',
        'other',
      ],
    },
    policyName: { type: String, required: true, trim: true },
    providerName: { type: String, required: true, trim: true },
    coverageAmount: { type: Number, min: 0 },
    premiumAmount: { type: Number, min: 0 },
    maxReturnAmount: { type: Number, min: 0 },
    paymentMode: { type: String, enum: ['monthly', 'yearly'], required: true, default: 'yearly' },
    paymentDate: { type: Date },
    premiumFrequency: { type: String, enum: ['monthly', 'quarterly', 'yearly'] },
    policyStartDate: { type: Date },
    policyEndDate: { type: Date },
    nextDebitDate: { type: Date },
    renewalDate: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false, collection: 'insurance_entries' },
);

insuranceSchema.index({ userId: 1, createdAt: -1 });

export const InsuranceEntryModel =
  (models.insurance_entries as Model<IInsuranceEntry> | undefined) ??
  model<IInsuranceEntry>('insurance_entries', insuranceSchema);
