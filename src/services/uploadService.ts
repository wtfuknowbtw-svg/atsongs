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
    
    const existingTrack = await Track.findOne({
      fileHash,
      status: 'active',
      importStatus: { $ne: 'failed' },
    });
    if (existingTrack) {
      throw new AppError(409, errorCodes.DUPLICATE_TRACK, 'A track with this file content already exists');
    }

    // Stale failed/soft-deleted rows still occupy the unique fileHash index;
    // remove them so the same file can be re-uploaded.
    await Track.deleteMany({
      fileHash,
      $or: [{ status: 'deleted' }, { importStatus: 'failed' }],
    });

    let audioStorageKey: string | null = null;
    let artworkStorageKey: string | null = null;
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

      // Upload audio to B2 (private bucket). Key is deterministic:
      // audio/<placeholderTrackId>.<ext> so retries overwrite, never orphan.
      logger.info('Uploading audio to B2 storage', { trackId });
      const uploadResult = await storageService.uploadAudio(
        file.buffer,
        file.originalname,
        trackId
      );
      audioStorageKey = uploadResult.storageKey;

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
      let artworkKey: string | undefined;
      if (metadata.hasArtwork && metadata.artworkBuffer) {
        logger.info('Uploading embedded artwork', { trackId });
        const artworkResult = await this.uploadArtwork(
          metadata.artworkBuffer,
          file.originalname,
          metadata.artworkFormat,
          trackId
        );
        artworkStorageKey = artworkResult.storageKey;
        artworkKey = artworkStorageKey;

        // Remember the key on the album so album artwork can be resolved later.
        // Album.artwork (legacy public Cloudinary URL) is left untouched so old
        // albums keep rendering until they are purged.
        if (normalizedMetadata.albumId) {
          await normalizationService.updateAlbumArtwork(
            normalizedMetadata.albumId,
            artworkKey
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
          storageKey: uploadResult.storageKey,
          artworkKey,
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

      // Cleanup B2 objects on failure (log keys only, never URLs/secrets)
      if (audioStorageKey) {
        try {
          await storageService.deleteObject(audioStorageKey);
          logger.info('Cleaned up B2 audio after failure', { storageKey: audioStorageKey });
        } catch (cleanupError) {
          logger.error('Failed to cleanup B2 audio:', cleanupError);
        }
      }

      if (artworkStorageKey) {
        try {
          await storageService.deleteObject(artworkStorageKey);
          logger.info('Cleaned up B2 artwork after failure', { storageKey: artworkStorageKey });
        } catch (cleanupError) {
          logger.error('Failed to cleanup B2 artwork:', cleanupError);
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
    format: string | undefined,
    trackId: string
  ): Promise<{ storageKey: string }> {
    try {
      const rawExt = (format || "jpg").split("/").pop() || "jpg";
      const ext = rawExt.replace(/[^a-z0-9]/gi, "") || "jpg";
      const artworkFilename = "artwork_" + originalFilename + "." + ext;
      const uploadResult = await storageService.uploadImage(
        artworkBuffer,
        artworkFilename,
        trackId
      );
      logger.info("Artwork uploaded successfully", { storageKey: uploadResult.storageKey });
      return { storageKey: uploadResult.storageKey };
    } catch (error) {
      logger.error("Failed to upload artwork:", error);
      throw new AppError(500, errorCodes.STORAGE_ERROR, "Failed to upload artwork");
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
