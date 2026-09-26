import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaybackHistory extends Document {
  userId: mongoose.Types.ObjectId;
  trackId: mongoose.Types.ObjectId;
  playedAt: Date;
  duration: number;
  completed: boolean;
}

const playbackHistorySchema = new Schema<IPlaybackHistory>(
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
    playedAt: {
      type: Date,
      default: Date.now,
    },
    duration: {
      type: Number,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

playbackHistorySchema.index({ userId: 1, playedAt: -1 });
playbackHistorySchema.index({ trackId: 1 });

export const PlaybackHistory = mongoose.model<IPlaybackHistory>('PlaybackHistory', playbackHistorySchema);
