import { UploadResult } from '../../services/storageService';

export const mockStorageService = {
  uploadAudio: jest.fn().mockResolvedValue({
    publicId: 'test-public-id',
    resourceType: 'video',
    format: 'mp3',
    version: '1234567890',
    url: 'https://res.cloudinary.com/test/audio.mp3',
    secureUrl: 'https://res.cloudinary.com/test/audio.mp3',
    bytes: 1024,
    duration: 180,
  } as UploadResult),

  uploadImage: jest.fn().mockResolvedValue({
    publicId: 'test-artwork-id',
    resourceType: 'image',
    format: 'jpg',
    version: '1234567890',
    url: 'https://res.cloudinary.com/test/artwork.jpg',
    secureUrl: 'https://res.cloudinary.com/test/artwork.jpg',
    bytes: 512,
    width: 500,
    height: 500,
  } as UploadResult),

  deleteResource: jest.fn().mockResolvedValue(true),

  getResourceUrl: jest.fn().mockReturnValue('https://res.cloudinary.com/test/audio.mp3'),

  getSignedUrl: jest.fn().mockResolvedValue('https://res.cloudinary.com/test/audio.mp3?expires=123'),

  resourceExists: jest.fn().mockResolvedValue(true),

  getResourceMetadata: jest.fn().mockResolvedValue({
    public_id: 'test-public-id',
    resource_type: 'video',
    format: 'mp3',
    bytes: 1024,
    duration: 180,
  }),
};
