import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaylistTrack extends Document {
  playlistId: mongoose.Types.ObjectId;
  trackId: mongoose.Types.ObjectId;
  position: number;
  addedAt: Date;
  addedBy: mongoose.Types.ObjectId;
}

const playlistTrackSchema = new Schema<IPlaylistTrack>(
  {
    playlistId: {
      type: Schema.Types.ObjectId,
      ref: 'Playlist',
      required: true,
    },
    trackId: {
      type: Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

playlistTrackSchema.index({ playlistId: 1, position: 1 });
playlistTrackSchema.index({ trackId: 1 });

export const PlaylistTrack = mongoose.model<IPlaylistTrack>('PlaylistTrack', playlistTrackSchema);
