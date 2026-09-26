import mongoose, { Document, Schema } from 'mongoose';

export interface IGenre extends Document {
  name: string;
  normalizedName: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const genreSchema = new Schema<IGenre>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

genreSchema.index({ normalizedName: 1 }, { unique: true });

export const Genre = mongoose.model<IGenre>('Genre', genreSchema);
