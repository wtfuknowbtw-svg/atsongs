import { metadataService } from '../services/metadataService';

describe('MetadataService', () => {
  describe('calculateFileHash', () => {
    it('should calculate consistent hash for same content', () => {
      const buffer = Buffer.from('test content');
      const hash1 = metadataService.calculateFileHash(buffer);
      const hash2 = metadataService.calculateFileHash(buffer);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 character hex string
    });

    it('should calculate different hash for different content', () => {
      const buffer1 = Buffer.from('content 1');
      const buffer2 = Buffer.from('content 2');
      const hash1 = metadataService.calculateFileHash(buffer1);
      const hash2 = metadataService.calculateFileHash(buffer2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(metadataService.getFileExtension('song.mp3')).toBe('mp3');
      expect(metadataService.getFileExtension('track.flac')).toBe('flac');
      expect(metadataService.getFileExtension('audio.wav')).toBe('wav');
    });

    it('should handle files without extension', () => {
      expect(metadataService.getFileExtension('noextension')).toBe('');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(metadataService.formatDuration(0)).toBe('0:00');
      expect(metadataService.formatDuration(60)).toBe('1:00');
      expect(metadataService.formatDuration(125)).toBe('2:05');
      expect(metadataService.formatDuration(3665)).toBe('61:05');
    });
  });

  describe('formatFileSize', () => {
    it('should format file size correctly', () => {
      expect(metadataService.formatFileSize(0)).toBe('0 Bytes');
      expect(metadataService.formatFileSize(1024)).toBe('1 KB');
      expect(metadataService.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(metadataService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });
});
