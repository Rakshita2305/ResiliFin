import { Document, Schema, model, models, type Model } from 'mongoose';

export type SavingsType = 'normal' | 'emergency' | 'fd' | 'rd' | 'sip' | 'ppf' | 'other';

export interface ISavingsEntry extends Document {
  userId: Schema.Types.ObjectId;
  type: SavingsType;
  instrumentName: string;
  amount: number;
  startDate?: Date;
  interestRate?: number;
  maturityDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const savingsSchema = new Schema<ISavingsEntry>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'users' },
    type: {
      type: String,
      required: true,
      enum: ['normal', 'emergency', 'fd', 'rd', 'sip', 'ppf', 'other'],
    },
    instrumentName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    startDate: { type: Date },
    interestRate: { type: Number, min: 0, max: 100 },
    maturityDate: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false, collection: 'savings_entries' },
);

savingsSchema.index({ userId: 1, createdAt: -1 });

export const SavingsEntryModel =
  (models.savings_entries as Model<ISavingsEntry> | undefined) ??
  model<ISavingsEntry>('savings_entries', savingsSchema);
