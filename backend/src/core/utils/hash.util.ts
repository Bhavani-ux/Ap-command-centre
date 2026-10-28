import bcrypt from 'bcrypt';
import { authConfig } from '../../config/auth.config';

export class HashUtil {
  static async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, authConfig.password.saltRounds);
  }

  static async compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }

  static async generateSalt(): Promise<string> {
    return bcrypt.genSalt(authConfig.password.saltRounds);
  }
}
