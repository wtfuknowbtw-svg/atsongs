import { Request, Response, NextFunction } from 'express';
import { mediaAccessService } from '../services/mediaAccessService';
import { successResponse } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';

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
      res.status(200).json(successResponse({ artworkUrl }));
    } catch (error) {
      next(error);
    }
  }
}

export const mediaController = new MediaController();
