import { Genre, Track } from '../models';
import { AppError, errorCodes } from '../middleware/errorHandler';

export class GenreService {
  async getGenres(): Promise<any[]> {
    const genres = await Genre.find()
      .select('-__v')
      .sort({ name: 1 })
      .lean();

    // Get track counts for each genre
    const genreNames = genres.map(g => g.name);
    const trackCounts = await Track.aggregate([
      { $match: { genre: { $in: genreNames }, status: 'active' } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
    ]);

    const trackCountMap = new Map(
      trackCounts.map(tc => [tc._id, tc.count])
    );

    return genres.map(genre => ({
      ...genre,
      trackCount: trackCountMap.get(genre.name) || 0,
    }));
  }

  async getGenreById(id: string): Promise<any> {
    const genre = await Genre.findById(id);
    
    if (!genre) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Genre not found');
    }

    // Get tracks for this genre
    const tracks = await Track.find({ genre: genre.name, status: 'active' })
      .select('id title artist album duration artwork')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return {
      ...genre.toObject(),
      tracks,
      trackCount: tracks.length,
    };
  }
}

export const genreService = new GenreService();
