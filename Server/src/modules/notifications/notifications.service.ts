import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

let firebaseAdmin: any = null;

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  async onModuleInit() {
    if (!process.env.FIREBASE_PROJECT_ID) {
      this.logger.warn('Firebase not configured - push notifications disabled');
      return;
    }
    try {
      const admin = await import('firebase-admin');
      if (!admin.apps.length) {
        const credential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
          ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
          : admin.credential.applicationDefault();
        admin.initializeApp({ credential });
      }
      firebaseAdmin = admin;
      this.logger.log('Firebase initialized');
    } catch (e) {
      this.logger.error('Firebase init error', e);
    }
  }

  async sendPush(tokens: string[], payload: Record<string, string>): Promise<{ success: boolean; sent: number; failed: number }> {
    if (!firebaseAdmin || tokens.length === 0) {
      this.logger.log(`Push skipped (${tokens.length} tokens, firebase=${!!firebaseAdmin})`);
      return { success: true, sent: 0, failed: 0 };
    }
    const messages = tokens.map((token) => ({
      token,
      notification: { title: payload.title, body: payload.body },
      data: Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined)),
    }));
    try {
      const res = await firebaseAdmin.messaging().sendEach(messages);
      return { success: true, sent: res.successCount, failed: res.failureCount };
    } catch (e) {
      this.logger.error('Push send failed', e);
      return { success: false, sent: 0, failed: tokens.length };
    }
  }

  async registerToken(userId: string, token: string, platform: string) {
    this.logger.log(`Register FCM token for user ${userId} on ${platform}`);
    return { registered: true };
  }
}
