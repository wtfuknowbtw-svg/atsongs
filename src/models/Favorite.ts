import mongoose, { Document, Schema } from 'mongoose';

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  trackId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
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
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index({ userId: 1, trackId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1 });

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema);
