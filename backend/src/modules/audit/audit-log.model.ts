import { Document, Schema, model } from 'mongoose';

export interface IAuditLog extends Document {
  userId: Schema.Types.ObjectId;
  entityType: string;
  entityId: Schema.Types.ObjectId;
  action: 'create' | 'update' | 'delete';
  reasonTag?: string;
  before?: unknown;
  after?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'users' },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, enum: ['create', 'update', 'delete'], required: true },
    reasonTag: { type: String, trim: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const AuditLogModel = model<IAuditLog>('audit_logs', auditLogSchema);
