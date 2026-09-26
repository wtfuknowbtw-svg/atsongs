import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { errorCodes, errorResponse } from '../utils/apiResponse';

export { errorCodes };
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      errorResponse(err.code, err.message, err.details)
    );
  }

  // Default error
  const statusCode = 500;
  const code = errorCodes.INTERNAL_ERROR;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : err.message;

  return res.status(statusCode).json(errorResponse(code, message));
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json(
    errorResponse(errorCodes.NOT_FOUND, `Route ${req.method} ${req.path} not found`)
  );
};
