import { Request, Response, NextFunction } from 'express';
import { artistService } from '../services/artistService';
import { successResponse } from '../utils/apiResponse';

export class ArtistController {
  async getArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const options = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        search: req.query.search as string,
      };

      const result = await artistService.getArtists(options);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getArtistById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const artist = await artistService.getArtistById(id);
      res.status(200).json(successResponse(artist));
    } catch (error) {
      next(error);
    }
  }
}

export const artistController = new ArtistController();
