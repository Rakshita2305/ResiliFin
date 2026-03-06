import { Document, Schema, model, models, type Model } from 'mongoose';

export type BillEntryType = 'bill' | 'subscription';
export type BillCycle = 'one-time' | 'monthly' | 'yearly';
export type BillStatus = 'active' | 'cancelled';

export interface IBillSubscriptionEntry extends Document {
  userId: Schema.Types.ObjectId;
  entryType: BillEntryType;
  title: string;
  providerName?: string;
  category?: string;
  amount: number;
  cycle: BillCycle;
  autopayEnabled: boolean;
  paymentDueDate: Date;
  startDate?: Date;
  endDate?: Date;
  status: BillStatus;
  includeInMonthlyExpense: boolean;
  lastProcessedAt?: Date;
  nextChargeDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const billSubscriptionSchema = new Schema<IBillSubscriptionEntry>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'users' },
    entryType: { type: String, required: true, enum: ['bill', 'subscription'] },
    title: { type: String, required: true, trim: true },
    providerName: { type: String, trim: true },
    category: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    cycle: { type: String, required: true, enum: ['one-time', 'monthly', 'yearly'] },
    autopayEnabled: { type: Boolean, required: true, default: false },
    paymentDueDate: { type: Date, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, required: true, enum: ['active', 'cancelled'], default: 'active' },
    includeInMonthlyExpense: { type: Boolean, required: true, default: true },
    lastProcessedAt: { type: Date },
    nextChargeDate: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false, collection: 'bill_subscription_entries' },
);

billSubscriptionSchema.index({ userId: 1, createdAt: -1 });

export const BillSubscriptionEntryModel =
  (models.bill_subscription_entries as Model<IBillSubscriptionEntry> | undefined) ??
  model<IBillSubscriptionEntry>('bill_subscription_entries', billSubscriptionSchema);
