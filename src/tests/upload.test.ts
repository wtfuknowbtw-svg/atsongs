import mongoose from 'mongoose';
import { uploadService } from '../services/uploadService';
import { Track } from '../models';
import { AppError } from '../middleware/errorHandler';
import { mockStorageService } from './mocks/storageService.mock';

jest.mock('../services/storageService');
jest.mock('../services/normalizationService');
// music-metadata is ESM-only; keep it out of the CommonJS test runtime.
jest.mock('../services/metadataService');

const MOCK_ARTIST_ID = new mongoose.Types.ObjectId().toHexString();
const MOCK_ALBUM_ID = new mongoose.Types.ObjectId().toHexString();
const MOCK_GENRE_ID = new mongoose.Types.ObjectId().toHexString();
const MOCK_USER_ID = new mongoose.Types.ObjectId().toHexString();

const createMockFile = (): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'test-song.mp3',
    encoding: '7bit',
    mimetype: 'audio/mpeg',
    size: 1024 * 1024,
    buffer: Buffer.alloc(1024 * 1024),
  }) as Express.Multer.File;

describe('UploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const metadataService = require('../services/metadataService').metadataService;
    metadataService.getFileExtension.mockReturnValue('mp3');
    metadataService.calculateFileHash.mockReturnValue('test-file-hash');
    metadataService.extractMetadata.mockResolvedValue({
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      duration: 180,
      hasArtwork: false,
    });

    const normalizationService = require('../services/normalizationService').normalizationService;
    normalizationService.normalizeTrackMetadata.mockResolvedValue({
      artistId: MOCK_ARTIST_ID,
      albumId: MOCK_ALBUM_ID,
      genreId: MOCK_GENRE_ID,
      isArtistNew: true,
      isAlbumNew: true,
      isGenreNew: true,
    });
  });

  describe('uploadTrack', () => {
    it('should successfully upload a valid track', async () => {
      const mockFile = createMockFile();

      const mockStorageService = require('../services/storageService').storageService;
      mockStorageService.uploadAudio.mockResolvedValue({
        storageKey: 'audio/test-track-id.mp3',
        resourceType: 'audio',
        format: 'mp3',
        bytes: 1024 * 1024,
        contentType: 'audio/mpeg',
        duration: 180,
      });

      const result = await uploadService.uploadTrack(mockFile, MOCK_USER_ID);

      expect(result.track).toBeDefined();
      expect(result.track.title).toBeDefined();
      expect(result.track.importStatus).toBe('ready');
      expect(mockStorageService.uploadAudio).toHaveBeenCalled();
    });

    it('should detect duplicate files', async () => {
      const mockFile = createMockFile();

      // Mock existing track with the same hash the metadata service reports.
      await Track.create({
        title: 'Existing Track',
        artist: 'Test Artist',
        duration: 180,
        fileFormat: 'mp3',
        fileSize: 1024 * 1024,
        storageKey: 'audio/existing-id.mp3',
        originalFilename: 'test-song.mp3',
        fileHash: 'test-file-hash',
        importStatus: 'ready',
        status: 'active',
      });

      await expect(uploadService.uploadTrack(mockFile, MOCK_USER_ID)).rejects.toMatchObject({
        statusCode: 409,
        code: 'DUPLICATE_TRACK',
      });
    });

    it('should handle B2 upload failure', async () => {
      const mockFile = createMockFile();

      const mockStorageService = require('../services/storageService').storageService;
      mockStorageService.uploadAudio.mockRejectedValue(new Error('B2 error'));

      await expect(uploadService.uploadTrack(mockFile, MOCK_USER_ID)).rejects.toThrow('Failed to upload track');
    });
  });
});
