import bcrypt from 'bcryptjs';
import { User } from '../models';
import { config } from '../config';
import { AppError, errorCodes } from '../middleware/errorHandler';

export class AdminSetupService {
  async createFirstAdmin(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('Admin credentials not configured in environment variables');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await User.create({
      email: adminEmail,
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN',
    });

    console.log('First admin user created successfully');
  }

  async ensureAdminExists(): Promise<boolean> {
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    
    if (adminCount === 0) {
      console.log('No admin users found. Creating first admin from environment variables...');
      await this.createFirstAdmin();
      return true;
    }
    
    return false;
  }
}

export const adminSetupService = new AdminSetupService();
