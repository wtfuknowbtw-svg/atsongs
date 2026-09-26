import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './errorHandler';

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', details);
      }
      next(error);
    }
  };
};
