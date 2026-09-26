import mongoose, { Document, Schema } from 'mongoose';

export interface IArtist extends Document {
  name: string;
  normalizedName: string;
  bio?: string;
  image?: string;
  cloudinaryPublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const artistSchema = new Schema<IArtist>(
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
    bio: {
      type: String,
    },
    image: {
      type: String,
    },
    cloudinaryPublicId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

artistSchema.index({ normalizedName: 1 }, { unique: true });

export const Artist = mongoose.model<IArtist>('Artist', artistSchema);
