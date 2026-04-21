import { Schema, model, type Document, type Types } from 'mongoose';

export interface IUser extends Document<Types.ObjectId> {
  email: string;
  name: string;
  provider: 'google' | 'amazon';
  providerId: string;
  role: 'admin' | 'user';
  createdAt: Date;
  lastLogin: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    provider: { type: String, enum: ['google', 'amazon'], required: true },
    providerId: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.index({ provider: 1, providerId: 1 }, { unique: true });

export const User = model<IUser>('User', userSchema);
