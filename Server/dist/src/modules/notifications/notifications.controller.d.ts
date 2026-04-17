import { Model } from 'mongoose';
import { NotificationTokenDocument } from "../../database/schemas/notification-token.schema";
declare class RegisterTokenDto {
    token: string;
    platform: string;
}
export declare class NotificationsController {
    private readonly tokenModel;
    constructor(tokenModel: Model<NotificationTokenDocument>);
    registerToken(user: {
        userId: string;
    }, dto: RegisterTokenDto): Promise<{
        registered: boolean;
    }>;
}
export {};
