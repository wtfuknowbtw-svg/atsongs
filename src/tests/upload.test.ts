import { uploadService } from '../services/uploadService';
import { Track } from '../models';
import { AppError } from '../middleware/errorHandler';
import { mockStorageService } from './mocks/storageService.mock';

jest.mock('../services/storageService');
jest.mock('../services/normalizationService');

describe('UploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadTrack', () => {
    it('should successfully upload a valid track', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test-song.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        size: 1024 * 1024,
        buffer: Buffer.alloc(1024 * 1024),
      } as Express.Multer.File;

      const mockStorageService = require('../services/storageService').storageService;
      mockStorageService.uploadAudio.mockResolvedValue({
        publicId: 'test-public-id',
        resourceType: 'video',
        format: 'mp3',
        version: '1234567890',
        url: 'https://res.cloudinary.com/test/audio.mp3',
        secureUrl: 'https://res.cloudinary.com/test/audio.mp3',
        bytes: 1024 * 1024,
        duration: 180,
      });

      const mockNormalizationService = require('../services/normalizationService').normalizationService;
      mockNormalizationService.normalizeTrackMetadata.mockResolvedValue({
        artistId: 'artist-id',
        albumId: 'album-id',
        genreId: 'genre-id',
        isArtistNew: true,
        isAlbumNew: true,
        isGenreNew: true,
      });

      const result = await uploadService.uploadTrack(mockFile, 'user-id');

      expect(result.track).toBeDefined();
      expect(result.track.title).toBeDefined();
      expect(result.track.importStatus).toBe('ready');
      expect(mockStorageService.uploadAudio).toHaveBeenCalled();
    });

    it('should detect duplicate files', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test-song.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        size: 1024 * 1024,
        buffer: Buffer.alloc(1024 * 1024),
      } as Express.Multer.File;

      // Mock existing track
      await Track.create({
        title: 'Existing Track',
        artist: 'Test Artist',
        duration: 180,
        fileFormat: 'mp3',
        fileSize: 1024 * 1024,
        cloudinaryPublicId: 'existing-id',
        cloudinaryResourceType: 'video',
        cloudinaryFormat: 'mp3',
        cloudinaryVersion: '123',
        originalFilename: 'test-song.mp3',
        fileHash: 'hash',
        importStatus: 'ready',
        status: 'active',
      });

      await expect(uploadService.uploadTrack(mockFile, 'user-id')).rejects.toThrow('DUPLICATE_TRACK');
    });

    it('should handle Cloudinary upload failure', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test-song.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        size: 1024 * 1024,
        buffer: Buffer.alloc(1024 * 1024),
      } as Express.Multer.File;

      const mockStorageService = require('../services/storageService').storageService;
      mockStorageService.uploadAudio.mockRejectedValue(new Error('Cloudinary error'));

      await expect(uploadService.uploadTrack(mockFile, 'user-id')).rejects.toThrow('Failed to upload track');
    });
  });
});
