import { OnModuleInit } from '@nestjs/common';
export declare class NotificationsService implements OnModuleInit {
    private readonly logger;
    onModuleInit(): Promise<void>;
    sendPush(tokens: string[], payload: Record<string, string>): Promise<{
        success: boolean;
        sent: number;
        failed: number;
    }>;
    registerToken(userId: string, token: string, platform: string): Promise<{
        registered: boolean;
    }>;
}
