import { fileValidationService } from '../services/fileValidationService';
import { AppError } from '../middleware/errorHandler';

describe('FileValidationService', () => {
  describe('validateUpload', () => {
    it('should validate a valid MP3 file', () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test-song.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        size: 1024 * 1024, // 1MB
        buffer: Buffer.alloc(1024 * 1024),
      } as Express.Multer.File;

      const result = fileValidationService.validateUpload(mockFile);

      expect(result.isValid).toBe(true);
      expect(result.fileFormat).toBe('mp3');
      expect(result.fileSize).toBe(1024 * 1024);
    });

    it('should reject file that is too large', () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'large-song.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        size: 100 * 1024 * 1024, // 100MB
        buffer: Buffer.alloc(100 * 1024 * 1024),
      } as Express.Multer.File;

      const result = fileValidationService.validateUpload(mockFile);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('size');
    });

    it('should reject unsupported file format', () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test-song.exe',
        encoding: '7bit',
        mimetype: 'application/octet-stream',
        size: 1024,
        buffer: Buffer.alloc(1024),
      } as Express.Multer.File;

      const result = fileValidationService.validateUpload(mockFile);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('format');
    });

    it('should reject empty file', () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'empty.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        size: 0,
        buffer: Buffer.alloc(0),
      } as Express.Multer.File;

      const result = fileValidationService.validateUpload(mockFile);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize dangerous characters', () => {
      const dangerous = '../../etc/passwd.mp3';
      const sanitized = fileValidationService.sanitizeFilename(dangerous);
      
      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/');
    });

    it('should remove invalid Windows characters', () => {
      const invalid = 'test<file>name.mp3';
      const sanitized = fileValidationService.sanitizeFilename(invalid);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });
  });

  describe('throwIfInvalid', () => {
    it('should throw error for invalid validation', () => {
      const invalidResult = {
        isValid: false,
        error: 'File is too large',
      };

      expect(() => fileValidationService.throwIfInvalid(invalidResult)).toThrow(AppError);
    });

    it('should not throw for valid validation', () => {
      const validResult = {
        isValid: true,
        fileSize: 1024,
        fileFormat: 'mp3',
      };

      expect(() => fileValidationService.throwIfInvalid(validResult)).not.toThrow();
    });
  });
});
