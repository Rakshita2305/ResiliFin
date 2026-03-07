import { Document, Schema, model } from 'mongoose';

export interface IStatementCycle extends Document {
  userId: Schema.Types.ObjectId;
  cycleStartAt: Date;
  lastUploadAt: Date;
  uploadCount: number;
  totalOutflow: number;
  totalInflow: number;
  estimatedMonthlyOutflow: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const statementCycleSchema = new Schema<IStatementCycle>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'users' },
    cycleStartAt: { type: Date, required: true, index: true },
    lastUploadAt: { type: Date, required: true, index: true },
    uploadCount: { type: Number, required: true, min: 1, default: 1 },
    totalOutflow: { type: Number, required: true, min: 0 },
    totalInflow: { type: Number, required: true, min: 0 },
    estimatedMonthlyOutflow: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

statementCycleSchema.index({ userId: 1, cycleStartAt: -1 });

export const StatementCycleModel = model<IStatementCycle>('statement_cycles', statementCycleSchema);
