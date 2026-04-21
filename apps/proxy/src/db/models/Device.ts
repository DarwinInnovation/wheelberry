import { Schema, model, type Document, type Types } from 'mongoose';

export interface IDevice extends Document<Types.ObjectId> {
  app: string;
  uid: string;
  name: string;
  owner: Types.ObjectId;
  config: Record<string, unknown>;
}

const deviceSchema = new Schema<IDevice>(
  {
    app: { type: String, required: true, trim: true },
    uid: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

deviceSchema.index({ app: 1, uid: 1 });
deviceSchema.index({ owner: 1 });

export const Device = model<IDevice>('Device', deviceSchema);
