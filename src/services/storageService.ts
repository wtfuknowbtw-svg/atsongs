import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import logger from '../utils/logger';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export interface UploadResult {
  publicId: string;
  resourceType: string;
  format: string;
  version: string;
  url: string;
  secureUrl: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface StorageService {
  uploadAudio(file: Buffer, filename: string, folder?: string): Promise<UploadResult>;
  uploadImage(file: Buffer, filename: string, folder?: string): Promise<UploadResult>;
  deleteResource(publicId: string, resourceType?: string): Promise<boolean>;
  getResourceUrl(publicId: string, resourceType?: string, transformations?: any): string;
  getSignedUrl(publicId: string, resourceType?: string, expiresIn?: number): Promise<string>;
  resourceExists(publicId: string, resourceType?: string): Promise<boolean>;
  getResourceMetadata(publicId: string, resourceType?: string): Promise<any>;
}

class CloudinaryStorageService implements StorageService {
  private generatePublicId(filename: string, folder?: string): string {
    const sanitized = filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\s+/g, '_')
      .toLowerCase();
    
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    
    if (folder) {
      return `${folder}/${timestamp}_${randomStr}_${sanitized}`;
    }
    
    return `music/audio/${timestamp}_${randomStr}_${sanitized}`;
  }

  async uploadAudio(file: Buffer, filename: string, folder: string = 'music/audio'): Promise<UploadResult> {
    try {
      const publicId = this.generatePublicId(filename, folder);
      
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: 'video',
            folder,
            chunk_size: 6000000,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file);
      });

      logger.info('Audio uploaded successfully', { publicId: result.public_id });

      return {
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        version: result.version.toString(),
        url: result.url,
        secureUrl: result.secure_url,
        bytes: result.bytes,
        duration: result.duration,
      };
    } catch (error) {
      logger.error('Error uploading audio to Cloudinary:', error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
            ? JSON.stringify(error)
            : String(error);
      throw new Error(`Failed to upload audio file: ${message}`);
    }
  }

  async uploadImage(file: Buffer, filename: string, folder: string = 'music/artwork'): Promise<UploadResult> {
    try {
      const publicId = this.generatePublicId(filename, folder);
      
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: 'image',
            folder,
            transformation: [
              { quality: 'auto', fetch_format: 'auto' }
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file);
      });

      logger.info('Image uploaded successfully', { publicId: result.public_id });

      return {
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        version: result.version.toString(),
        url: result.url,
        secureUrl: result.secure_url,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      logger.error('Error uploading image to Cloudinary:', error);
      throw new Error('Failed to upload image file');
    }
  }

  async deleteResource(publicId: string, resourceType: string = 'video'): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      if (result.result === 'ok' || result.result === 'not found') {
        logger.info('Resource deleted successfully', { publicId });
        return true;
      }

      logger.warn('Resource deletion failed', { publicId, result });
      return false;
    } catch (error) {
      logger.error('Error deleting resource from Cloudinary:', error);
      return false;
    }
  }

  getResourceUrl(publicId: string, resourceType: string = 'video', transformations: any = {}): string {
    return cloudinary.url(publicId, {
      resource_type: resourceType,
      ...transformations,
    });
  }

  async getSignedUrl(publicId: string, resourceType: string = 'video', expiresIn: number = 3600): Promise<string> {
    try {
      const url = cloudinary.url(publicId, {
        resource_type: resourceType,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      });

      return url;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  async resourceExists(publicId: string, resourceType: string = 'video'): Promise<boolean> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });
      return !!result;
    } catch (error) {
      return false;
    }
  }

  async getResourceMetadata(publicId: string, resourceType: string = 'video'): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });
      return result;
    } catch (error) {
      logger.error('Error fetching resource metadata:', error);
      throw new Error('Failed to fetch resource metadata');
    }
  }
}

export const storageService = new CloudinaryStorageService();
