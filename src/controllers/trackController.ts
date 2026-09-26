import { Request, Response, NextFunction } from 'express';
import { trackService } from '../services/trackService';
import { successResponse } from '../utils/apiResponse';

export class TrackController {
  async getTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const options = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        artist: req.query.artist as string,
        album: req.query.album as string,
        genre: req.query.genre as string,
        search: req.query.search as string,
        sort: req.query.sort as 'newest' | 'oldest' | 'title' | 'artist' | 'album',
      };

      const result = await trackService.getTracks(options);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getTrackById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const track = await trackService.getTrackById(id);
      res.status(200).json(successResponse(track));
    } catch (error) {
      next(error);
    }
  }

  async getRecentlyAdded(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const tracks = await trackService.getRecentlyAdded(limit);
      res.status(200).json(successResponse(tracks));
    } catch (error) {
      next(error);
    }
  }
}

export const trackController = new TrackController();
