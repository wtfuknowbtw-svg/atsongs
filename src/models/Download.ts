import mongoose, { Document, Schema } from 'mongoose';

export interface IDownload extends Document {
  userId: mongoose.Types.ObjectId;
  trackId: mongoose.Types.ObjectId;
  downloadedAt: Date;
  fileSize: number;
  format: string;
}

const downloadSchema = new Schema<IDownload>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trackId: {
      type: Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    format: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

downloadSchema.index({ userId: 1, trackId: 1 }, { unique: true });
downloadSchema.index({ userId: 1 });

export const Download = mongoose.model<IDownload>('Download', downloadSchema);
