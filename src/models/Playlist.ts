import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  isPublic: boolean;
  trackCount: number;
  totalDuration: number;
  artwork?: string;
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new Schema<IPlaylist>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    trackCount: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    artwork: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

playlistSchema.index({ userId: 1 });
playlistSchema.index({ isPublic: 1 });

export const Playlist = mongoose.model<IPlaylist>('Playlist', playlistSchema);
