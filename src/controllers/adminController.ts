import { Response, NextFunction } from 'express';
import { uploadService } from '../services/uploadService';
import { successResponse } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';
import { Track, Album, Artist } from '../models';
import { storageService } from '../services/storageService';
import { AppError, errorCodes } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class AdminController {
  async uploadTrack(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, errorCodes.FILE_UPLOAD_ERROR, 'No file provided');
      }

      const userId = req.user?.id as string;
      const result = await uploadService.uploadTrack(req.file, userId);

      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async deleteTrack(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const track = await Track.findById(id);
      if (!track) {
        throw new AppError(404, errorCodes.NOT_FOUND, 'Track not found');
      }

      // Remove the audio object from B2 (log key only, never URLs/secrets).
      let audioDeleted = true;
      if (track.storageKey) {
        audioDeleted = await storageService.deleteObject(track.storageKey);

        if (!audioDeleted) {
          logger.warn('Failed to delete B2 audio object', {
            storageKey: track.storageKey,
          });
        }
      }

      // Remove artwork only when no other active track shares the same key.
      // Shared artwork is per-trackId keys today, so this is normally 0 — the
      // refcount check stays so a future shared key is still safe.
      let artworkDeleted = false;
      if (track.artworkKey) {
        const artworkUsage = await Track.countDocuments({
          artworkKey: track.artworkKey,
          _id: { $ne: id },
          status: 'active',
        });

        if (artworkUsage === 0) {
          artworkDeleted = await storageService.deleteObject(track.artworkKey);

          if (!artworkDeleted) {
            logger.warn('Failed to delete B2 artwork object', {
              storageKey: track.artworkKey,
            });
          } else if (track.albumId) {
            // Clear the album row only if it still points at this track's key.
            const { Album } = await import('../models');
            const album = await Album.findById(track.albumId);
            if (album && (album as any).artworkKey === track.artworkKey) {
              await Album.findByIdAndUpdate(track.albumId, {
                artwork: null,
                artworkKey: null,
              });
              logger.info('Removed artwork from album', { albumId: track.albumId });
            }
          }
        } else {
          logger.info('Artwork is shared with other tracks, skipping deletion', {
            storageKey: track.artworkKey,
            usageCount: artworkUsage,
          });
        }
      }

      // Remove the DB record as well as the B2 object(s).
      await Track.findByIdAndDelete(id);

      logger.info('Track deleted successfully', {
        trackId: id,
        userId,
        audioDeleted,
        artworkDeleted,
      });

      res.status(200).json(successResponse({
        message: 'Track deleted successfully',
        audioDeleted,
        artworkDeleted,
      }));
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [
        totalTracks,
        totalAlbums,
        totalArtists,
        totalSize,
        readyTracks,
        failedTracks,
        processingTracks
      ] = await Promise.all([
        Track.countDocuments({ status: 'active', importStatus: 'ready' }),
        Album.countDocuments(),
        Artist.countDocuments(),
        Track.aggregate([
          { $match: { status: 'active', importStatus: 'ready' } },
          { $group: { _id: null, total: { $sum: '$fileSize' } } }
        ]),
        Track.countDocuments({ status: 'active', importStatus: 'ready' }),
        Track.countDocuments({ status: 'active', importStatus: 'failed' }),
        Track.countDocuments({ status: 'active', importStatus: { $in: ['uploading', 'processing'] } }),
      ]);

      res.status(200).json(successResponse({
        totalTracks,
        totalAlbums,
        totalArtists,
        totalStorageUsed: totalSize[0]?.total || 0,
        readyTracks,
        failedTracks,
        processingTracks,
      }));
    } catch (error) {
      next(error);
    }
  }

  async getRecentUploads(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const uploads = await Track.find({ status: 'active' })
        .select('id title artist album importStatus processingError createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      res.status(200).json(successResponse(uploads));
    } catch (error) {
      next(error);
    }
  }

  async getFailedUploads(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const failed = await Track.find({ 
        status: 'active', 
        importStatus: 'failed' 
      })
        .select('id title artist album processingError createdAt')
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json(successResponse(failed));
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
