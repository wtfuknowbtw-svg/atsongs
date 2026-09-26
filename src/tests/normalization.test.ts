import { normalizationService } from '../services/normalizationService';
import { Artist, Album, Genre } from '../models';
import { AppError } from '../middleware/errorHandler';

describe('NormalizationService', () => {
  beforeEach(async () => {
    await Artist.deleteMany({});
    await Album.deleteMany({});
    await Genre.deleteMany({});
  });

  describe('findOrCreateArtist', () => {
    it('should create a new artist', async () => {
      const result = await normalizationService.findOrCreateArtist('Test Artist');
      
      expect(result.isNew).toBe(true);
      expect(result.artistId).toBeDefined();
      
      const artist = await Artist.findById(result.artistId);
      expect(artist?.name).toBe('Test Artist');
      expect(artist?.normalizedName).toBe('test artist');
    });

    it('should find existing artist with different capitalization', async () => {
      await normalizationService.findOrCreateArtist('Test Artist');
      
      const result = await normalizationService.findOrCreateArtist('TEST ARTIST');
      
      expect(result.isNew).toBe(false);
      expect(result.artistId).toBeDefined();
    });

    it('should throw error for empty artist name', async () => {
      await expect(normalizationService.findOrCreateArtist('')).rejects.toThrow(AppError);
    });
  });

  describe('findOrCreateAlbum', () => {
    it('should create a new album', async () => {
      const artistResult = await normalizationService.findOrCreateArtist('Test Artist');
      const result = await normalizationService.findOrCreateAlbum('Test Album', artistResult.artistId);
      
      expect(result.isNew).toBe(true);
      expect(result.albumId).toBeDefined();
      
      const album = await Album.findById(result.albumId);
      expect(album?.title).toBe('Test Album');
      expect(album?.normalizedTitle).toBe('test album');
    });

    it('should find existing album with different capitalization', async () => {
      const artistResult = await normalizationService.findOrCreateArtist('Test Artist');
      await normalizationService.findOrCreateAlbum('Test Album', artistResult.artistId);
      
      const result = await normalizationService.findOrCreateAlbum('TEST ALBUM', artistResult.artistId);
      
      expect(result.isNew).toBe(false);
    });
  });

  describe('findOrCreateGenre', () => {
    it('should create a new genre', async () => {
      const result = await normalizationService.findOrCreateGenre('Rock');
      
      expect(result.isNew).toBe(true);
      expect(result.genreId).toBeDefined();
      
      const genre = await Genre.findById(result.genreId);
      expect(genre?.name).toBe('Rock');
      expect(genre?.normalizedName).toBe('rock');
    });

    it('should find existing genre with different capitalization', async () => {
      await normalizationService.findOrCreateGenre('Rock');
      
      const result = await normalizationService.findOrCreateGenre('ROCK');
      
      expect(result.isNew).toBe(false);
    });
  });
});
