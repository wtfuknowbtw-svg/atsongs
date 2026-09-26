import mongoose, { Document, Schema } from 'mongoose';

export interface ILyrics extends Document {
  trackId: mongoose.Types.ObjectId;
  content: string;
  isSynced: boolean;
  source?: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

const lyricsSchema = new Schema<ILyrics>(
  {
    trackId: {
      type: Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    isSynced: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
    },
    language: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Lyrics = mongoose.model<ILyrics>('Lyrics', lyricsSchema);
