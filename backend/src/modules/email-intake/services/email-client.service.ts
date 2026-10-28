import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { emailIntakeConfig } from '../../../config/email-intake.config';
import { EmailMessageDto, EmailAttachmentDto } from '../dto/email-intake.dto';

export class EmailClientService {
  private imap: Imap | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap = new Imap(emailIntakeConfig.imap);

      this.imap.once('ready', () => {
        console.log('IMAP connection established');
        resolve();
      });

      this.imap.once('error', (err: Error) => {
        console.error('IMAP connection error:', err);
        reject(err);
      });

      this.imap.connect();
    });
  }

  async disconnect(): Promise<void> {
    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }
  }

  async openInbox(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP not connected'));
        return;
      }

      this.imap.openBox(emailIntakeConfig.folders.inbox, false, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async fetchUnreadEmails(limit: number = 10): Promise<EmailMessageDto[]> {
    return new Promise(async (resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP not connected'));
        return;
      }

      try {
        this.imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            resolve([]);
            return;
          }

          const messagesToFetch = results.slice(0, limit);
          const messages: EmailMessageDto[] = [];

          const fetch = this.imap!.fetch(messagesToFetch, {
            bodies: '',
            markSeen: false,
          });

          fetch.on('message', (msg, seqno) => {
            let uid: number = 0;
            let buffer = '';

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('attributes', (attrs) => {
              uid = attrs.uid;
            });

            msg.once('end', async () => {
              try {
                const parsed = await simpleParser(buffer);
                const emailMessage = this.parseEmail(parsed, uid);
                messages.push(emailMessage);
              } catch (parseErr) {
                console.error('Error parsing email:', parseErr);
              }
            });
          });

          fetch.once('error', (fetchErr) => {
            reject(fetchErr);
          });

          fetch.once('end', () => {
            resolve(messages);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private parseEmail(parsed: ParsedMail, uid: number): EmailMessageDto {
    const attachments: EmailAttachmentDto[] = [];

    if (parsed.attachments) {
      parsed.attachments.forEach((attachment) => {
        attachments.push({
          filename: attachment.filename || 'unknown',
          contentType: attachment.contentType,
          size: attachment.size,
          content: attachment.content,
        });
      });
    }

    return {
      id: parsed.messageId || `${uid}-${Date.now()}`,
      uid,
      from: parsed.from?.text || '',
      to: parsed.to?.text || '',
      subject: parsed.subject || '',
      body: parsed.text || '',
      bodyHtml: parsed.html || '',
      receivedDate: parsed.date || new Date(),
      attachments,
    };
  }

  async markAsRead(uid: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP not connected'));
        return;
      }

      this.imap.setFlags(uid, ['\\Seen'], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async moveToFolder(uid: number, folderName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP not connected'));
        return;
      }

      this.imap.move(uid, folderName, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  isAllowedSender(email: string): boolean {
    const { allowedSenders, allowedDomains } = emailIntakeConfig;

    // If no restrictions, allow all
    if (allowedSenders.length === 0 && allowedDomains.length === 0) {
      return true;
    }

    // Check specific email addresses
    if (allowedSenders.includes(email)) {
      return true;
    }

    // Check domains
    const domain = email.split('@')[1];
    if (domain && allowedDomains.includes(domain)) {
      return true;
    }

    return false;
  }

  isValidAttachment(attachment: EmailAttachmentDto): boolean {
    const { maxSize, allowedExtensions } = emailIntakeConfig.attachments;

    // Check size
    if (attachment.size > maxSize) {
      return false;
    }

    // Check extension
    const ext = attachment.filename.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!ext || !allowedExtensions.includes(ext)) {
      return false;
    }

    return true;
  }
}
