import { Album, Track } from '../models';
import { AppError, errorCodes } from '../middleware/errorHandler';

export interface AlbumQueryOptions {
  page?: number;
  limit?: number;
  artist?: string;
  year?: number;
  genre?: string;
  search?: string;
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

export class AlbumService {
  async getAlbums(options: AlbumQueryOptions): Promise<PaginatedResponse<any>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (options.artist) {
      query.artist = new RegExp(options.artist, 'i');
    }

    if (options.year) {
      query.year = options.year;
    }

    if (options.genre) {
      query.genre = new RegExp(options.genre, 'i');
    }

    if (options.search) {
      query.$or = [
        { title: new RegExp(options.search, 'i') },
        { artist: new RegExp(options.search, 'i') },
      ];
    }

    const [albums, total] = await Promise.all([
      Album.find(query)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Album.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Get track counts for each album
    const albumIds = albums.map(a => a._id);
    const trackCounts = await Track.aggregate([
      { $match: { albumId: { $in: albumIds }, status: 'active' } },
      { $group: { _id: '$albumId', count: { $sum: 1 } } },
    ]);

    const trackCountMap = new Map(
      trackCounts.map(tc => [tc._id.toString(), tc.count])
    );

    const data = albums.map(album => ({
      ...album,
      trackCount: trackCountMap.get(album._id.toString()) || 0,
    }));

    return {
      data,
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

  async getAlbumById(id: string): Promise<any> {
    const album = await Album.findById(id);
    
    if (!album) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Album not found');
    }

    // Get tracks for this album
    const tracks = await Track.find({ albumId: id, status: 'active' })
      .select('id title artist duration trackNumber discNumber artwork')
      .sort({ discNumber: 1, trackNumber: 1 })
      .lean();

    return {
      ...album.toObject(),
      tracks,
      trackCount: tracks.length,
    };
  }
}

export const albumService = new AlbumService();
