import { Track, Album } from '../models';
import { storageService, STREAM_URL_EXPIRY_SECONDS, DOWNLOAD_URL_EXPIRY_SECONDS, ARTWORK_URL_EXPIRY_SECONDS } from './storageService';
import { AppError, errorCodes } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class MediaAccessService {
  async getStreamUrl(trackId: string, userId?: string): Promise<string> {
    const track = await Track.findOne({ 
      _id: trackId, 
      status: 'active',
      importStatus: 'ready'
    });
    
    if (!track || !track.storageKey) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Track not found or not ready for streaming');
    }

    try {
      // Presigned GET on the B2 object (~1 hour). B2/S3 honours Range
      // requests on presigned URLs, so seeking keeps working.
      const streamUrl = await storageService.getPresignedGetUrl(
        track.storageKey,
        STREAM_URL_EXPIRY_SECONDS
      );

      logger.info('Stream URL generated', { trackId, userId });
      return streamUrl;
    } catch (error) {
      logger.error('Error generating stream URL:', error);
      throw new AppError(500, errorCodes.INTERNAL_ERROR, 'Failed to generate stream URL');
    }
  }

  async getDownloadUrl(trackId: string, userId?: string): Promise<string> {
    const track = await Track.findOne({ 
      _id: trackId, 
      status: 'active',
      importStatus: 'ready'
    });
    
    if (!track || !track.storageKey) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Track not found or not ready for download');
    }

    try {
      const filename = track.originalFilename || `track.${track.fileFormat || 'mp3'}`;
      const downloadUrl = await storageService.getPresignedGetUrl(
        track.storageKey,
        DOWNLOAD_URL_EXPIRY_SECONDS,
        `attachment; filename="${filename.replace(/"/g, '')}"`
      );

      logger.info('Download URL generated', { trackId, userId });
      return downloadUrl;
    } catch (error) {
      logger.error('Error generating download URL:', error);
      throw new AppError(500, errorCodes.INTERNAL_ERROR, 'Failed to generate download URL');
    }
  }

  async getArtworkUrl(trackId: string): Promise<string | null> {
    const track = await Track.findOne({ 
      _id: trackId, 
      status: 'active',
      importStatus: 'ready'
    });
    
    if (!track) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Track not found');
    }

    if (track.artworkKey) {
      return storageService.getPresignedGetUrl(track.artworkKey, ARTWORK_URL_EXPIRY_SECONDS);
    }

    if (track.artwork) {
      return track.artwork;
    }

    return null;
  }

  /**
   * Resolve album artwork: prefer the album's own private-bucket key, fall back
   * to the legacy public URL, then to any track of the album that carries
   * embedded artwork (uploads store the key on both docs).
   */
  async getAlbumArtworkUrl(albumId: string): Promise<string | null> {
    const album = await Album.findById(albumId);
    if (!album) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Album not found');
    }

    if (album.artworkKey) {
      return storageService.getPresignedGetUrl(album.artworkKey, ARTWORK_URL_EXPIRY_SECONDS);
    }

    if (album.artwork) {
      return album.artwork;
    }

    const trackWithArtwork = await Track.findOne({
      albumId: album._id,
      status: 'active',
      importStatus: 'ready',
      artworkKey: { $ne: null },
    }).select('artworkKey');

    if (trackWithArtwork?.artworkKey) {
      return storageService.getPresignedGetUrl(
        trackWithArtwork.artworkKey,
        ARTWORK_URL_EXPIRY_SECONDS
      );
    }

    return null;
  }
}

export const mediaAccessService = new MediaAccessService();
