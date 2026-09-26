import { Track } from '../models';
import { storageService } from './storageService';
import { AppError, errorCodes } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class MediaAccessService {
  async getStreamUrl(trackId: string, userId?: string): Promise<string> {
    const track = await Track.findOne({ 
      _id: trackId, 
      status: 'active',
      importStatus: 'ready'
    });
    
    if (!track) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Track not found or not ready for streaming');
    }

    try {
      const streamUrl = storageService.getResourceUrl(
        track.cloudinaryPublicId,
        track.cloudinaryResourceType,
        {
          streaming_profile: 'full_hd',
          format: 'mp3',
        }
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
    
    if (!track) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'Track not found or not ready for download');
    }

    try {
      const downloadUrl = await storageService.getSignedUrl(
        track.cloudinaryPublicId,
        track.cloudinaryResourceType,
        3600 // 1 hour expiry
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

    if (track.artwork) {
      return track.artwork;
    }

    return null;
  }
}

export const mediaAccessService = new MediaAccessService();
