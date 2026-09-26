import { Track } from '../models';
import { AppError, errorCodes } from '../middleware/errorHandler';

export interface TrackQueryOptions {
  page?: number;
  limit?: number;
  artist?: string;
  album?: string;
  genre?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'title' | 'artist' | 'album';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class TrackService {
  async getTracks(options: TrackQueryOptions): Promise<PaginatedResponse<any>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = { status: 'active', importStatus: 'ready' };

    if (options.artist) {
      query.artist = new RegExp(options.artist, 'i');
    }

    if (options.album) {
      query.album = new RegExp(options.album, 'i');
    }

    if (options.genre) {
      query.genre = new RegExp(options.genre, 'i');
    }

    if (options.search) {
      query.$or = [
        { title: new RegExp(options.search, 'i') },
        { artist: new RegExp(options.search, 'i') },
        { album: new RegExp(options.search, 'i') },
      ];
    }

    // Determine sort order
    let sort: any = { createdAt: -1 }; // default: newest
    switch (options.sort) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'title':
        sort = { title: 1 };
        break;
      case 'artist':
        sort = { artist: 1, album: 1, trackNumber: 1 };
        break;
      case 'album':
        sort = { album: 1, discNumber: 1, trackNumber: 1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }

    const [tracks, total] = await Promise.all([
      Track.find(query)
        .select('-__v -fileHash -cloudinaryVersion -processingError')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Track.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tracks.map(track => this.sanitizeTrack(track)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getTrackById(id: string): Promise<any> {
    const track = await Track.findOne({ _id: id, status: 'active', importStatus: 'ready' });
    
    if (!track) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Track not found');
    }

    return this.sanitizeTrack(track.toObject());
  }

  async getRecentlyAdded(limit: number = 20): Promise<any[]> {
    const tracks = await Track.find({ status: 'active', importStatus: 'ready' })
      .select('-__v -fileHash -cloudinaryVersion -processingError')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return tracks.map(track => this.sanitizeTrack(track));
  }

  private sanitizeTrack(track: any) {
    return {
      id: track._id,
      title: track.title,
      artist: track.artist,
      artistId: track.artistId,
      album: track.album,
      albumId: track.albumId,
      albumArtist: track.albumArtist,
      genre: track.genre,
      genreId: track.genreId,
      year: track.year,
      duration: track.duration,
      trackNumber: track.trackNumber,
      discNumber: track.discNumber,
      fileFormat: track.fileFormat,
      bitrate: track.bitrate,
      codec: track.codec,
      sampleRate: track.sampleRate,
      channels: track.channels,
      fileSize: track.fileSize,
      artwork: track.artwork,
      importStatus: track.importStatus,
      createdAt: track.createdAt,
      updatedAt: track.updatedAt,
    };
  }
}

export const trackService = new TrackService();
