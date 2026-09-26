import { Track } from '../models';
import { storageService } from './storageService';
import { metadataService, AudioMetadata } from './metadataService';
import { fileValidationService } from './fileValidationService';
import { normalizationService } from './normalizationService';
import { AppError, errorCodes } from '../middleware/errorHandler';
import logger from '../utils/logger';

export interface UploadResult {
  track: any;
  metadata: AudioMetadata;
}

export class UploadService {
  async uploadTrack(file: Express.Multer.File, userId: string): Promise<UploadResult> {
    const validationResult = fileValidationService.validateUpload(file);
    fileValidationService.throwIfInvalid(validationResult);

    const fileHash = metadataService.calculateFileHash(file.buffer);
    
    const existingTrack = await Track.findOne({ fileHash, status: 'active' });
    if (existingTrack) {
      throw new AppError(409, errorCodes.DUPLICATE_TRACK, 'A track with this file content already exists');
    }

    let cloudinaryPublicId: string | null = null;
    let cloudinaryArtworkPublicId: string | null = null;
    let trackId: string | null = null;

    try {
      // Update status to uploading
      const tempTrack = await Track.create({
        title: fileValidationService.sanitizeFilename(file.originalname),
        artist: 'Unknown Artist',
        duration: 0,
        fileFormat: validationResult.fileFormat || 'mp3',
        fileSize: file.size,
        originalFilename: fileValidationService.sanitizeFilename(file.originalname),
        fileHash: fileHash,
        importStatus: 'uploading',
        status: 'active',
      });
      trackId = tempTrack._id.toString();

      // Upload audio to Cloudinary
      logger.info('Uploading audio to Cloudinary', { trackId });
      const uploadResult = await storageService.uploadAudio(
        file.buffer,
        file.originalname,
        'music/audio'
      );
      cloudinaryPublicId = uploadResult.publicId;

      // Update status to processing
      await Track.findByIdAndUpdate(trackId, { importStatus: 'processing' });

      // Extract metadata
      logger.info('Extracting metadata', { trackId });
      const metadata = await metadataService.extractMetadata(file.buffer, file.originalname);

      // Normalize artist, album, genre
      const normalizedMetadata = await normalizationService.normalizeTrackMetadata(
        metadata.artist || 'Unknown Artist',
        metadata.album,
        metadata.genre
      );

      // Handle embedded artwork
      let artworkUrl: string | undefined;
      if (metadata.hasArtwork && metadata.artworkBuffer) {
        logger.info('Uploading embedded artwork', { trackId });
        const artworkResult = await this.uploadArtwork(
          metadata.artworkBuffer,
          file.originalname,
          metadata.artworkFormat
        );
        cloudinaryArtworkPublicId = artworkResult.publicId;
        artworkUrl = artworkResult.secureUrl;

        // Update album artwork if album exists
        if (normalizedMetadata.albumId) {
          await normalizationService.updateAlbumArtwork(
            normalizedMetadata.albumId,
            artworkUrl,
            cloudinaryArtworkPublicId
          );
        }
      }

      // Update track with all metadata
      const track = await Track.findByIdAndUpdate(
        trackId,
        {
          title: metadata.title || fileValidationService.sanitizeFilename(file.originalname),
          artist: metadata.artist || 'Unknown Artist',
          artistId: normalizedMetadata.artistId,
          album: metadata.album,
          albumId: normalizedMetadata.albumId,
          albumArtist: metadata.albumArtist,
          genre: metadata.genre,
          genreId: normalizedMetadata.genreId,
          year: metadata.year,
          duration: metadata.duration || 0,
          trackNumber: metadata.trackNumber,
          discNumber: metadata.discNumber,
          fileFormat: validationResult.fileFormat || 'mp3',
          bitrate: metadata.bitrate,
          codec: metadata.codec,
          sampleRate: metadata.sampleRate,
          channels: metadata.channels,
          fileSize: file.size,
          artwork: artworkUrl,
          cloudinaryArtworkPublicId,
          cloudinaryPublicId: uploadResult.publicId,
          cloudinaryResourceType: uploadResult.resourceType,
          cloudinaryFormat: uploadResult.format,
          cloudinaryVersion: uploadResult.version,
          metadataStatus: metadata.duration ? 'extracted' : 'pending',
          importStatus: 'ready',
        },
        { new: true }
      );

      logger.info('Track uploaded successfully', { 
        trackId: track!._id, 
        title: track!.title,
        userId 
      });

      return {
        track: this.sanitizeTrack(track!),
        metadata,
      };
    } catch (error) {
      logger.error('Error during track upload:', error);
      
      // Update track status to failed
      if (trackId) {
        await Track.findByIdAndUpdate(trackId, {
          importStatus: 'failed',
          processingError: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Cleanup Cloudinary assets on failure
      if (cloudinaryPublicId) {
        try {
          await storageService.deleteResource(cloudinaryPublicId, 'video');
          logger.info('Cleaned up Cloudinary audio after failure', { publicId: cloudinaryPublicId });
        } catch (cleanupError) {
          logger.error('Failed to cleanup Cloudinary audio:', cleanupError);
        }
      }

      if (cloudinaryArtworkPublicId) {
        try {
          await storageService.deleteResource(cloudinaryArtworkPublicId, 'image');
          logger.info('Cleaned up Cloudinary artwork after failure', { publicId: cloudinaryArtworkPublicId });
        } catch (cleanupError) {
          logger.error('Failed to cleanup Cloudinary artwork:', cleanupError);
        }
      }

      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(500, errorCodes.INTERNAL_ERROR, 'Failed to upload track');
    }
  }

  private async uploadArtwork(
    artworkBuffer: Buffer, 
    originalFilename: string, 
    format?: string
  ): Promise<{ publicId: string; secureUrl: string }> {
    try {
      const artworkFilename = `artwork_${originalFilename}.${format || 'jpg'}`;
      const uploadResult = await storageService.uploadImage(
        artworkBuffer,
        artworkFilename,
        'music/artwork'
      );

      logger.info('Artwork uploaded successfully', { publicId: uploadResult.publicId });
      return {
        publicId: uploadResult.publicId,
        secureUrl: uploadResult.secureUrl,
      };
    } catch (error) {
      logger.error('Failed to upload artwork:', error);
      throw new AppError(500, errorCodes.CLOUDINARY_ERROR, 'Failed to upload artwork');
    }
  }

  private sanitizeTrack(track: any) {
    const trackObj = track.toObject();
    return {
      id: trackObj._id,
      title: trackObj.title,
      artist: trackObj.artist,
      album: trackObj.album,
      genre: trackObj.genre,
      year: trackObj.year,
      duration: trackObj.duration,
      artwork: trackObj.artwork,
      fileFormat: trackObj.fileFormat,
      bitrate: trackObj.bitrate,
      sampleRate: trackObj.sampleRate,
      channels: trackObj.channels,
      trackNumber: trackObj.trackNumber,
      discNumber: trackObj.discNumber,
      importStatus: trackObj.importStatus,
      createdAt: trackObj.createdAt,
    };
  }
}

export const uploadService = new UploadService();
