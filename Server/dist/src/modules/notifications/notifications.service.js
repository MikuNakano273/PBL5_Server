"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
let firebaseAdmin = null;
let NotificationsService = NotificationsService_1 = class NotificationsService {
    logger = new common_1.Logger(NotificationsService_1.name);
    async onModuleInit() {
        if (!process.env.FIREBASE_PROJECT_ID) {
            this.logger.warn('Firebase not configured - push notifications disabled');
            return;
        }
        try {
            const admin = await Promise.resolve().then(() => require('firebase-admin'));
            if (!admin.apps.length) {
                const credential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
                    ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
                    : admin.credential.applicationDefault();
                admin.initializeApp({ credential });
            }
            firebaseAdmin = admin;
            this.logger.log('Firebase initialized');
        }
        catch (e) {
            this.logger.error('Firebase init error', e);
        }
    }
    async sendPush(tokens, payload) {
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
        }
        catch (e) {
            this.logger.error('Push send failed', e);
            return { success: false, sent: 0, failed: tokens.length };
        }
    }
    async registerToken(userId, token, platform) {
        this.logger.log(`Register FCM token for user ${userId} on ${platform}`);
        return { registered: true };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map