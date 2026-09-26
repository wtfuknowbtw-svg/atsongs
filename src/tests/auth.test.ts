import { authService } from '../services/authService';
import { User } from '../models';
import { AppError } from '../middleware/errorHandler';

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const result = await authService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user.password).toBeUndefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await authService.register(userData);

      const result = await authService.login({
        email: userData.email,
        password: userData.password,
      });

      expect(result.user).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should throw error with invalid credentials', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const registerResult = await authService.register(userData);
      const refreshResult = await authService.refreshTokens(registerResult.tokens.refreshToken);

      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
    });

    it('should throw error with invalid refresh token', async () => {
      await expect(
        authService.refreshTokens('invalid-token')
      ).rejects.toThrow(AppError);
    });
  });
});
