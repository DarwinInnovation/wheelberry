import { Schema, model, type Document, type Types } from 'mongoose';

export interface IDeviceToken extends Document<Types.ObjectId> {
  tokenHash: string;
  device: Types.ObjectId;
  label: string;
  lastUsed: Date | null;
  revoked: boolean;
}

const deviceTokenSchema = new Schema<IDeviceToken>(
  {
    tokenHash: { type: String, required: true, unique: true },
    device: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    label: { type: String, required: true, trim: true },
    lastUsed: { type: Date, default: null },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

deviceTokenSchema.index({ device: 1 });

export const DeviceToken = model<IDeviceToken>('DeviceToken', deviceTokenSchema);
