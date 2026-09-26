import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'web';
  platform?: string;
  lastActive: Date;
  isActive: boolean;
}

const deviceSchema = new Schema<IDevice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
    deviceName: {
      type: String,
      required: true,
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'web'],
      required: true,
    },
    platform: {
      type: String,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
deviceSchema.index({ userId: 1 });

export const Device = mongoose.model<IDevice>('Device', deviceSchema);
