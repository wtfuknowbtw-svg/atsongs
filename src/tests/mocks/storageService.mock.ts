import { UploadResult } from '../../services/storageService';

export const mockStorageService = {
  uploadAudio: jest.fn().mockResolvedValue({
    storageKey: 'audio/test-track-id.mp3',
    resourceType: 'audio',
    format: 'mp3',
    bytes: 1024,
    contentType: 'audio/mpeg',
    duration: 180,
  } as UploadResult),

  uploadImage: jest.fn().mockResolvedValue({
    storageKey: 'artwork/test-track-id.jpg',
    resourceType: 'image',
    format: 'jpg',
    bytes: 512,
    contentType: 'image/jpeg',
    width: 500,
    height: 500,
  } as UploadResult),

  deleteObject: jest.fn().mockResolvedValue(true),

  deleteResource: jest.fn().mockResolvedValue(true),

  getPresignedGetUrl: jest.fn().mockResolvedValue('https://b2.test/file/test-place/stream?sig=test'),

  getSignedUrl: jest.fn().mockResolvedValue('https://b2.test/file/test-place/stream?sig=test'),

  resourceExists: jest.fn().mockResolvedValue(true),

  getResourceMetadata: jest.fn().mockResolvedValue({
    ContentLength: 1024,
    ContentType: 'audio/mpeg',
  }),
};
