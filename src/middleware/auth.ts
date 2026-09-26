import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError, errorCodes } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'USER';
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, errorCodes.AUTHENTICATION_ERROR, 'No token provided');
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: string;
        email: string;
        role: 'ADMIN' | 'USER';
      };
      
      req.user = decoded;
      next();
    } catch (jwtError) {
      throw new AppError(401, errorCodes.AUTHENTICATION_ERROR, 'Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (roles: ('ADMIN' | 'USER')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, errorCodes.AUTHENTICATION_ERROR, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, errorCodes.AUTHORIZATION_ERROR, 'Insufficient permissions');
    }

    next();
  };
};
