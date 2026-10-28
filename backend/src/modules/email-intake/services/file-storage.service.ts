import fs from 'fs/promises';
import path from 'path';
import { EmailAttachmentDto } from '../dto/email-intake.dto';
import { v4 as uuidv4 } from 'uuid';

export class FileStorageService {
  private baseStoragePath: string;

  constructor() {
    this.baseStoragePath = process.env.STORAGE_PATH || './storage/email-intake';
  }

  async saveAttachment(
    attachment: EmailAttachmentDto,
    companyId: string
  ): Promise<string> {
    // Create directory structure: storage/email-intake/{companyId}/{year}/{month}
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const dirPath = path.join(this.baseStoragePath, companyId, String(year), month);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Generate unique filename
    const ext = path.extname(attachment.filename);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(dirPath, filename);

    // Write file
    await fs.writeFile(filePath, attachment.content);

    return filePath;
  }

  async readFile(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }

  async getFileInfo(filePath: string): Promise<{ size: number; created: Date }> {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
    };
  }
}
