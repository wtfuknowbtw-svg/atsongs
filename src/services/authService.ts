import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models';
import { AppError, errorCodes } from '../middleware/errorHandler';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<{ user: any; tokens: AuthTokens }> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError(409, errorCodes.CONFLICT, 'User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: 'USER',
    });

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);

    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(data: LoginData): Promise<{ user: any; tokens: AuthTokens }> {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new AppError(401, errorCodes.AUTHENTICATION_ERROR, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, errorCodes.AUTHENTICATION_ERROR, 'Invalid credentials');
    }

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);

    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
        id: string;
        email: string;
        role: string;
      };

      const user = await User.findById(decoded.id);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        throw new AppError(401, errorCodes.AUTHENTICATION_ERROR, 'Invalid refresh token');
      }

      const tokens = this.generateTokens(user._id.toString(), user.email, user.role);

      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      return tokens;
    } catch (error) {
      throw new AppError(401, errorCodes.AUTHENTICATION_ERROR, 'Invalid or expired refresh token');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      await user.save();
    }
  }

  async logoutAll(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }
  }

  async getUserById(userId: string | undefined) {
    if (!userId) {
      throw new AppError(401, errorCodes.AUTHENTICATION_ERROR, 'User not authenticated');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'User not found');
    }

    return this.sanitizeUser(user);
  }

  private generateTokens(userId: string, email: string, role: string): AuthTokens {
    const accessToken = jwt.sign(
      { id: userId, email, role },
      config.jwt.secret,
      { expiresIn: config.jwt.accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      { id: userId, email, role },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshTokenExpiry }
    );

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;
    delete userObj.__v;
    return userObj;
  }
}

export const authService = new AuthService();
