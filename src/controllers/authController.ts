import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { successResponse } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register({ email, password, name });
      
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshTokens(refreshToken);
      
      res.status(200).json(successResponse(tokens));
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.id;
      
      if (userId && refreshToken) {
        await authService.logout(userId, refreshToken);
      }
      
      res.status(200).json(successResponse({ message: 'Logged out successfully' }));
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      
      if (userId) {
        await authService.logoutAll(userId);
      }
      
      res.status(200).json(successResponse({ message: 'Logged out from all devices' }));
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const user = await authService.getUserById(userId);
      
      res.status(200).json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
