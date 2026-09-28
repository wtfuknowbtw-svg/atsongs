import { Request, Response, NextFunction } from 'express';
import { mediaAccessService } from '../services/mediaAccessService';
import { successResponse } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class MediaController {
  async getStreamUrl(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const streamUrl = await mediaAccessService.getStreamUrl(id, userId);
      res.status(200).json(successResponse({ streamUrl }));
    } catch (error) {
      next(error);
    }
  }

  async getDownloadUrl(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const downloadUrl = await mediaAccessService.getDownloadUrl(id, userId);
      res.status(200).json(successResponse({ downloadUrl }));
    } catch (error) {
      next(error);
    }
  }

  async getArtworkUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const artworkUrl = await mediaAccessService.getArtworkUrl(id);
      if (!artworkUrl) {
        res.status(200).json(successResponse({ artworkUrl: null }));
        return;
      }
      // Artwork lives in the private B2 bucket — redirect to a short-lived
      // presigned URL. Never log the URL itself (it carries a signature).
      logger.info('Artwork redirect issued', { trackId: id });
      res.redirect(302, artworkUrl);
    } catch (error) {
      next(error);
    }
  }

  async getAlbumArtworkUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const artworkUrl = await mediaAccessService.getAlbumArtworkUrl(id);
      if (!artworkUrl) {
        res.status(200).json(successResponse({ artworkUrl: null }));
        return;
      }
      // Artwork lives in the private B2 bucket — redirect to a short-lived
      // presigned URL. Never log the URL itself (it carries a signature).
      logger.info('Album artwork redirect issued', { albumId: id });
      res.redirect(302, artworkUrl);
    } catch (error) {
      next(error);
    }
  }
}

export const mediaController = new MediaController();
