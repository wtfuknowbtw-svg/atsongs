import { Request, Response, NextFunction } from 'express';
import { genreService } from '../services/genreService';
import { successResponse } from '../utils/apiResponse';

export class GenreController {
  async getGenres(req: Request, res: Response, next: NextFunction) {
    try {
      const genres = await genreService.getGenres();
      res.status(200).json(successResponse(genres));
    } catch (error) {
      next(error);
    }
  }

  async getGenreById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const genre = await genreService.getGenreById(id);
      res.status(200).json(successResponse(genre));
    } catch (error) {
      next(error);
    }
  }
}

export const genreController = new GenreController();
