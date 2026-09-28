import mongoose from 'mongoose';
import { Artist, Album, Genre } from '../models';
import { AppError, errorCodes } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class NormalizationService {
  /**
   * Normalize a string for comparison (case-insensitive, trim whitespace)
   */
  private normalizeString(value: string): string {
    return value.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Find or create an artist with normalized name
   */
  async findOrCreateArtist(artistName: string): Promise<{ artistId: mongoose.Types.ObjectId; isNew: boolean }> {
    if (!artistName || artistName.trim() === '') {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Artist name cannot be empty');
    }

    const normalizedName = this.normalizeString(artistName);

    // Try to find existing artist with normalized name
    let artist = await Artist.findOne({ normalizedName });

    if (artist) {
      logger.debug('Found existing artist', { artistId: artist._id, name: artist.name });
      return { artistId: artist._id, isNew: false };
    }

    // Create new artist
    artist = await Artist.create({
      name: artistName.trim(),
      normalizedName,
    });

    logger.info('Created new artist', { artistId: artist._id, name: artist.name });
    return { artistId: artist._id, isNew: true };
  }

  /**
   * Find or create an album with normalized name
   */
  async findOrCreateAlbum(albumName: string, artistId?: mongoose.Types.ObjectId): Promise<{ albumId: mongoose.Types.ObjectId; isNew: boolean }> {
    if (!albumName || albumName.trim() === '') {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Album name cannot be empty');
    }

    const normalizedName = this.normalizeString(albumName);

    // Try to find existing album with normalized name
    const query: any = {
      normalizedTitle: normalizedName
    };

    // If artistId is provided, also match on artist
    if (artistId) {
      query.artistId = artistId;
    }

    let album = await Album.findOne(query);

    if (album) {
      logger.debug('Found existing album', { albumId: album._id, title: album.title });
      return { albumId: album._id, isNew: false };
    }

    // Create new album
    album = await Album.create({
      title: albumName.trim(),
      normalizedTitle: normalizedName,
      artistId,
    });

    logger.info('Created new album', { albumId: album._id, title: album.title });
    return { albumId: album._id, isNew: true };
  }

  /**
   * Find or create a genre with normalized name
   */
  async findOrCreateGenre(genreName: string): Promise<{ genreId: mongoose.Types.ObjectId; isNew: boolean }> {
    if (!genreName || genreName.trim() === '') {
      throw new AppError(400, errorCodes.VALIDATION_ERROR, 'Genre name cannot be empty');
    }

    const normalizedName = this.normalizeString(genreName);

    // Try to find existing genre with normalized name
    let genre = await Genre.findOne({ normalizedName });

    if (genre) {
      logger.debug('Found existing genre', { genreId: genre._id, name: genre.name });
      return { genreId: genre._id, isNew: false };
    }

    // Create new genre
    genre = await Genre.create({
      name: genreName.trim(),
      normalizedName,
    });

    logger.info('Created new genre', { genreId: genre._id, name: genre.name });
    return { genreId: genre._id, isNew: true };
  }

  /**
   * Batch normalize artist, album, and genre for a track
   */
  async normalizeTrackMetadata(
    artistName: string,
    albumName?: string,
    genreName?: string
  ): Promise<{
    artistId: mongoose.Types.ObjectId;
    albumId?: mongoose.Types.ObjectId;
    genreId?: mongoose.Types.ObjectId;
    isArtistNew: boolean;
    isAlbumNew: boolean;
    isGenreNew: boolean;
  }> {
    const artistResult = await this.findOrCreateArtist(artistName);
    
    let albumResult;
    if (albumName) {
      albumResult = await this.findOrCreateAlbum(albumName, artistResult.artistId);
    }

    let genreResult;
    if (genreName) {
      genreResult = await this.findOrCreateGenre(genreName);
    }

    return {
      artistId: artistResult.artistId,
      albumId: albumResult?.albumId,
      genreId: genreResult?.genreId,
      isArtistNew: artistResult.isNew,
      isAlbumNew: albumResult?.isNew || false,
      isGenreNew: genreResult?.isNew || false,
    };
  }

  /**
   * Update album artwork reference with the private-bucket artworkKey.
   * Album.artwork (legacy public Cloudinary URL) is left untouched.
   */
  async updateAlbumArtwork(albumId: mongoose.Types.ObjectId, artworkKey: string): Promise<void> {
    await Album.findByIdAndUpdate(albumId, {
      artworkKey,
    });
    logger.info('Updated album artwork', { albumId, artworkKey });
  }
}

export const normalizationService = new NormalizationService();
