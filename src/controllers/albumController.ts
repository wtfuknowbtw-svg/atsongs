import { Request, Response, NextFunction } from 'express';
import { albumService } from '../services/albumService';
import { successResponse } from '../utils/apiResponse';

export class AlbumController {
  async getAlbums(req: Request, res: Response, next: NextFunction) {
    try {
      const options = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        artist: req.query.artist as string,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        genre: req.query.genre as string,
        search: req.query.search as string,
      };

      const result = await albumService.getAlbums(options);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getAlbumById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const album = await albumService.getAlbumById(id);
      res.status(200).json(successResponse(album));
    } catch (error) {
      next(error);
    }
  }
}

export const albumController = new AlbumController();
