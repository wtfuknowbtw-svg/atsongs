import { config } from '../config';
import { AppError, errorCodes } from '../middleware/errorHandler';
import { metadataService } from './metadataService';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fileSize?: number;
  fileFormat?: string;
}

export class FileValidationService {
  private readonly MAX_FILE_SIZE: number;
  private readonly ALLOWED_FORMATS: Set<string>;
  private readonly MIME_TYPE_MAP: Record<string, string>;

  constructor() {
    this.MAX_FILE_SIZE = config.upload.maxFileSize;
    this.ALLOWED_FORMATS = new Set(config.upload.allowedFormats.map(f => f.toLowerCase()));
    this.MIME_TYPE_MAP = {
      mp3: 'audio/mpeg',
      flac: 'audio/flac',
      wav: 'audio/wav',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      ogg: 'audio/ogg',
    };
  }

  validateUpload(file: Express.Multer.File): ValidationResult {
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided',
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty',
      };
    }

    const fileExtension = metadataService.getFileExtension(file.originalname);
    
    if (!this.ALLOWED_FORMATS.has(fileExtension)) {
      return {
        isValid: false,
        error: `File format '${fileExtension}' is not supported. Allowed formats: ${Array.from(this.ALLOWED_FORMATS).join(', ')}`,
      };
    }

    if (!this.isSafeFilename(file.originalname)) {
      return {
        isValid: false,
        error: 'Filename contains invalid characters',
      };
    }

    return {
      isValid: true,
      fileSize: file.size,
      fileFormat: fileExtension,
    };
  }

  async validateMimeType(file: Express.Multer.File): Promise<boolean> {
    const expectedMimeType = this.MIME_TYPE_MAP[metadataService.getFileExtension(file.originalname)];
    
    if (!expectedMimeType) {
      return false;
    }

    if (file.mimetype && file.mimetype !== expectedMimeType) {
      return false;
    }

    return true;
  }

  private isSafeFilename(filename: string): boolean {
    const dangerousPatterns = [
      /\.\./, // Path traversal
      /[<>:"|?*]/, // Invalid Windows characters
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Reserved Windows names
      /^\./, // Hidden files
      /\s+$/, // Trailing spaces
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(filename)) {
        return false;
      }
    }

    return true;
  }

  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"|?*]/g, '_')
      .replace(/\.\./g, '_')
      .replace(/^\./, '_')
      .trim();
  }

  throwIfInvalid(validationResult: ValidationResult): void {
    if (!validationResult.isValid) {
      if (validationResult.error?.includes('size')) {
        throw new AppError(413, errorCodes.FILE_TOO_LARGE, validationResult.error);
      } else if (validationResult.error?.includes('format')) {
        throw new AppError(400, errorCodes.UNSUPPORTED_FORMAT, validationResult.error);
      } else {
        throw new AppError(400, errorCodes.FILE_UPLOAD_ERROR, validationResult.error);
      }
    }
  }
}

export const fileValidationService = new FileValidationService();
