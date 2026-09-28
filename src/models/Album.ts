import mongoose, { Document, Schema } from 'mongoose';

export interface IAlbum extends Document {
  title: string;
  normalizedTitle: string;
  artist?: string;
  artistId?: mongoose.Types.ObjectId;
  year?: number;
  genre?: string;
  artwork?: string;
  artworkKey?: string;
  cloudinaryPublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const albumSchema = new Schema<IAlbum>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedTitle: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    artist: {
      type: String,
      trim: true,
    },
    artistId: {
      type: Schema.Types.ObjectId,
      ref: 'Artist',
    },
    year: {
      type: Number,
    },
    genre: {
      type: String,
      trim: true,
    },
    artwork: {
      type: String,
    },
    artworkKey: {
      type: String,
      required: false,
    },
    cloudinaryPublicId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

albumSchema.index({ normalizedTitle: 1, artistId: 1 });
albumSchema.index({ title: 1, artist: 1 });

export const Album = mongoose.model<IAlbum>('Album', albumSchema);
