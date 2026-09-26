import mongoose, { Document, Schema } from 'mongoose';

export interface ITrack extends Document {
  title: string;
  artist: string;
  artistId?: mongoose.Types.ObjectId;
  album?: string;
  albumId?: mongoose.Types.ObjectId;
  albumArtist?: string;
  genre?: string;
  genreId?: mongoose.Types.ObjectId;
  year?: number;
  duration: number;
  trackNumber?: number;
  discNumber?: number;
  fileFormat: string;
  bitrate?: number;
  codec?: string;
  sampleRate?: number;
  channels?: number;
  fileSize: number;
  artwork?: string;
  cloudinaryArtworkPublicId?: string;
  cloudinaryPublicId: string;
  cloudinaryResourceType: string;
  cloudinaryFormat: string;
  cloudinaryVersion: string;
  originalFilename: string;
  fileHash: string;
  importStatus: 'uploading' | 'processing' | 'ready' | 'failed';
  metadataStatus: 'pending' | 'extracted' | 'failed';
  processingError?: string;
  status: 'active' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

const trackSchema = new Schema<ITrack>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
    },
    artistId: {
      type: Schema.Types.ObjectId,
      ref: 'Artist',
    },
    album: {
      type: String,
      trim: true,
    },
    albumId: {
      type: Schema.Types.ObjectId,
      ref: 'Album',
    },
    albumArtist: {
      type: String,
      trim: true,
    },
    genre: {
      type: String,
      trim: true,
    },
    genreId: {
      type: Schema.Types.ObjectId,
      ref: 'Genre',
    },
    year: {
      type: Number,
    },
    duration: {
      type: Number,
      required: true,
    },
    trackNumber: {
      type: Number,
    },
    discNumber: {
      type: Number,
    },
    fileFormat: {
      type: String,
      required: true,
    },
    bitrate: {
      type: Number,
    },
    codec: {
      type: String,
    },
    sampleRate: {
      type: Number,
    },
    channels: {
      type: Number,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    artwork: {
      type: String,
    },
    cloudinaryArtworkPublicId: {
      type: String,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
      unique: true,
    },
    cloudinaryResourceType: {
      type: String,
      required: true,
    },
    cloudinaryFormat: {
      type: String,
      required: true,
    },
    cloudinaryVersion: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    fileHash: {
      type: String,
      required: true,
      unique: true,
    },
    importStatus: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading',
    },
    metadataStatus: {
      type: String,
      enum: ['pending', 'extracted', 'failed'],
      default: 'pending',
    },
    processingError: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

trackSchema.index({ artist: 1, album: 1 });
trackSchema.index({ artistId: 1 });
trackSchema.index({ albumId: 1 });
trackSchema.index({ genreId: 1 });
trackSchema.index({ status: 1 });
trackSchema.index({ importStatus: 1 });
trackSchema.index({ createdAt: -1 });
trackSchema.index({ artist: 1, status: 1 });

export const Track = mongoose.model<ITrack>('Track', trackSchema);
