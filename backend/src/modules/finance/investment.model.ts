import { Document, Schema, model, models, type Model } from 'mongoose';

export type InvestmentType =
  | 'sip'
  | 'stocks'
  | 'mutual-funds'
  | 'gold'
  | 'real-estate'
  | 'bonds'
  | 'ppf'
  | 'elss'
  | 'etf'
  | 'other';

export type InvestmentMode = 'one-time' | 'monthly' | 'yearly';

export interface IInvestmentEntry extends Document {
  userId: Schema.Types.ObjectId;
  type: InvestmentType;
  investmentMode: InvestmentMode;
  instrumentName: string;
  investedAmount: number;
  currentValue?: number;
  assetSymbol?: string;
  units?: number;
  lastMarketPrice?: number;
  lastPriceUpdatedAt?: Date;
  recurringAmount?: number;
  startDate?: Date;
  endDate?: Date;
  isOpenEnded: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const investmentSchema = new Schema<IInvestmentEntry>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'users' },
    type: {
      type: String,
      required: true,
      enum: ['sip', 'stocks', 'mutual-funds', 'gold', 'real-estate', 'bonds', 'ppf', 'elss', 'etf', 'other'],
    },
    investmentMode: {
      type: String,
      required: true,
      enum: ['one-time', 'monthly', 'yearly'],
      default: 'one-time',
    },
    instrumentName: { type: String, required: true, trim: true },
    investedAmount: { type: Number, required: true, min: 0 },
    currentValue: { type: Number, min: 0 },
    assetSymbol: { type: String, trim: true, uppercase: true },
    units: { type: Number, min: 0 },
    lastMarketPrice: { type: Number, min: 0 },
    lastPriceUpdatedAt: { type: Date },
    recurringAmount: { type: Number, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    isOpenEnded: { type: Boolean, default: true, required: true },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
    notes: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false, collection: 'investment_entries' },
);

investmentSchema.index({ userId: 1, createdAt: -1 });

export const InvestmentEntryModel =
  (models.investment_entries as Model<IInvestmentEntry> | undefined) ??
  model<IInvestmentEntry>('investment_entries', investmentSchema);
