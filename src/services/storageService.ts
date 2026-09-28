import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import logger from '../utils/logger';

// Backblaze B2 (S3-compatible) storage. Cloudinary fields stay in the DB
// as legacy fields — the active storage backend is B2 only.

// Presigned URL lifetimes. Stream + download default to ~1 hour.
export const STREAM_URL_EXPIRY_SECONDS = 3600;
export const DOWNLOAD_URL_EXPIRY_SECONDS = 3600;
export const ARTWORK_URL_EXPIRY_SECONDS = 3600;

export interface UploadResult {
  storageKey: string;
  resourceType: string;
  format: string;
  bytes: number;
  contentType?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export interface StorageService {
  uploadAudio(file: Buffer, filename: string, trackId: string): Promise<UploadResult>;
  uploadImage(file: Buffer, filename: string, trackId: string): Promise<UploadResult>;
  deleteObject(storageKey: string): Promise<boolean>;
  deleteResource(storageKey: string): Promise<boolean>;
  getPresignedGetUrl(
    storageKey: string,
    expiresIn?: number,
    responseContentDisposition?: string
  ): Promise<string>;
  getSignedUrl(storageKey: string, expiresIn?: number): Promise<string>;
  resourceExists(storageKey: string): Promise<boolean>;
  getResourceMetadata(storageKey: string): Promise<any>;
}

function parseRegionFromEndpoint(endpoint: string): string {
  const hostname = new URL(endpoint).hostname.toLowerCase();
  // Expected form: s3.<region>.backblazeb2.com e.g. s3.us-west-004.backblazeb2.com
  const m = hostname.match(/^s3\.([^.]+)\.backblazeb2\.com$/);
  if (m) return m[1];
  throw new Error(
    `Could not parse B2 region from B2_ENDPOINT hostname "${hostname}". Expected https://s3.<region>.backblazeb2.com`
  );
}

function getExtension(filename: string, fallback: string): string {
  const raw = filename.split('.').pop()?.toLowerCase() || fallback;
  const afterSlash = raw.includes('/') ? raw.split('/').pop() || fallback : raw;
  const cleaned = afterSlash.replace(/[^a-z0-9]/g, '') || fallback;
  if (cleaned === 'jpeg') return 'jpg';
  return cleaned;
}

function contentTypeForExtension(ext: string, kind: 'audio' | 'image'): string {
  const audioMap: Record<string, string> = {
    mp3: 'audio/mpeg',
    flac: 'audio/flac',
    wav: 'audio/wav',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
  };
  const imageMap: Record<string, string> = {
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  if (kind === 'audio') return audioMap[ext] || 'audio/mpeg';
  return imageMap[ext] || 'image/jpeg';
}

let cachedClient: S3Client | null = null;

function getS3Client(): S3Client {
  if (cachedClient) return cachedClient;
  const { keyId, appKey, endpoint, bucket } = config.b2;
  if (!keyId || !appKey || !endpoint || !bucket) {
    throw new Error('Missing B2 configuration (B2_KEY_ID, B2_APP_KEY, B2_ENDPOINT, B2_BUCKET)');
  }
  const region = parseRegionFromEndpoint(endpoint);
  cachedClient = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId: keyId, secretAccessKey: appKey },
  });
  return cachedClient;
}

class B2StorageService implements StorageService {

  async uploadAudio(file: Buffer, filename: string, trackId: string): Promise<UploadResult> {
    const ext = getExtension(filename, 'mp3');
    const storageKey = `audio/${trackId}.${ext}`;
    const contentType = contentTypeForExtension(ext, 'audio');
    try {
      const client = getS3Client();
      const upload = new Upload({
        client,
        params: { Bucket: config.b2.bucket, Key: storageKey, Body: file, ContentType: contentType },
      });
      await upload.done();
      logger.info('Audio uploaded to B2', { storageKey, bytes: file.length, trackId });
      return { storageKey, resourceType: 'audio', format: ext, bytes: file.length, contentType };
    } catch (error) {
      logger.error('Error uploading audio to B2:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to upload audio file: ${message}`);
    }
  }

  async uploadImage(file: Buffer, filename: string, trackId: string): Promise<UploadResult> {
    const ext = getExtension(filename, 'jpg');
    const storageKey = `artwork/${trackId}.${ext}`;
    const contentType = contentTypeForExtension(ext, 'image');
    try {
      const client = getS3Client();
      const upload = new Upload({
        client,
        params: { Bucket: config.b2.bucket, Key: storageKey, Body: file, ContentType: contentType },
      });
      await upload.done();
      logger.info('Image uploaded to B2', { storageKey, bytes: file.length, trackId });
      return { storageKey, resourceType: 'image', format: ext, bytes: file.length, contentType };
    } catch (error) {
      logger.error('Error uploading image to B2:', error);
      throw new Error('Failed to upload image file');
    }
  }

  async deleteObject(storageKey: string): Promise<boolean> {
    try {
      const client = getS3Client();
      await client.send(new DeleteObjectCommand({ Bucket: config.b2.bucket, Key: storageKey }));
      logger.info('B2 object deleted', { storageKey });
      return true;
    } catch (error) {
      logger.error('Error deleting object from B2:', error);
      return false;
    }
  }

  async deleteResource(storageKey: string): Promise<boolean> {
    return this.deleteObject(storageKey);
  }

  async getPresignedGetUrl(
    storageKey: string,
    expiresIn: number = STREAM_URL_EXPIRY_SECONDS,
    responseContentDisposition?: string
  ): Promise<string> {
    try {
      const client = getS3Client();
      const command = new GetObjectCommand({
        Bucket: config.b2.bucket,
        Key: storageKey,
        ...(responseContentDisposition ? { ResponseContentDisposition: responseContentDisposition } : {}),
      });
      const url = await getSignedUrl(client, command, { expiresIn });
      logger.info('Presigned GET URL generated', { storageKey, expiresIn });
      return url;
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  async getSignedUrl(storageKey: string, expiresIn: number = 3600): Promise<string> {
    return this.getPresignedGetUrl(storageKey, expiresIn);
  }

  async resourceExists(storageKey: string): Promise<boolean> {
    try {
      const client = getS3Client();
      await client.send(new HeadObjectCommand({ Bucket: config.b2.bucket, Key: storageKey }));
      return true;
    } catch (error) {
      return false;
    }
  }

  async getResourceMetadata(storageKey: string): Promise<any> {
    try {
      const client = getS3Client();
      return await client.send(new HeadObjectCommand({ Bucket: config.b2.bucket, Key: storageKey }));
    } catch (error) {
      logger.error('Error fetching B2 object metadata:', error);
      throw new Error('Failed to fetch resource metadata');
    }
  }
}

export const storageService = new B2StorageService();
