import { Artist, Track } from '../models';
import { AppError, errorCodes } from '../middleware/errorHandler';

export interface ArtistQueryOptions {
  page?: number;
  limit?: number;
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

export class ArtistService {
  async getArtists(options: ArtistQueryOptions): Promise<PaginatedResponse<any>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (options.search) {
      query.name = new RegExp(options.search, 'i');
    }

    const [artists, total] = await Promise.all([
      Artist.find(query)
        .select('-__v')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Artist.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Get track counts for each artist
    const artistIds = artists.map(a => a._id);
    const trackCounts = await Track.aggregate([
      { $match: { artistId: { $in: artistIds }, status: 'active' } },
      { $group: { _id: '$artistId', count: { $sum: 1 } } },
    ]);

    const trackCountMap = new Map(
      trackCounts.map(tc => [tc._id.toString(), tc.count])
    );

    const data = artists.map(artist => ({
      ...artist,
      trackCount: trackCountMap.get(artist._id.toString()) || 0,
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

  async getArtistById(id: string): Promise<any> {
    const artist = await Artist.findById(id);
    
    if (!artist) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Artist not found');
    }

    // Get tracks for this artist
    const tracks = await Track.find({ artistId: id, status: 'active' })
      .select('id title album duration artwork')
      .sort({ album: 1, trackNumber: 1 })
      .lean();

    // Get albums for this artist
    const albums = await Track.aggregate([
      { $match: { artistId: id, status: 'active', album: { $ne: null } } },
      { $group: { _id: '$album', albumId: { $first: '$albumId' }, artwork: { $first: '$artwork' } } },
    ]);

    return {
      ...artist.toObject(),
      tracks,
      albums,
      trackCount: tracks.length,
      albumCount: albums.length,
    };
  }
}

export const artistService = new ArtistService();
