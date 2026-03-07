import { Document, Schema, model } from 'mongoose';

export interface IUserSession extends Document {
  userId: Schema.Types.ObjectId;
  jti: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSessionSchema = new Schema<IUserSession>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'users' },
    jti: { type: String, required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSessionSchema.index({ userId: 1, jti: 1 }, { unique: true });

export const UserSessionModel = model<IUserSession>('user_sessions', userSessionSchema);
