import { Queue } from 'bullmq';
import { Model } from 'mongoose';
import { ImageRequestDocument } from "../../database/schemas/image-request.schema";
import { VisionResultDocument } from "../../database/schemas/vision-result.schema";
import { AlertDocument } from "../../database/schemas/alert.schema";
import { AlertReceiverDocument } from "../../database/schemas/alert-receiver.schema";
import { CareLinkDocument } from "../../database/schemas/care-link.schema";
import { NotificationTokenDocument } from "../../database/schemas/notification-token.schema";
import { UserLiveStatusDocument } from "../../database/schemas/user-live-status.schema";
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
export declare class InternalService {
    private readonly imageRequestModel;
    private readonly visionResultModel;
    private readonly alertModel;
    private readonly alertReceiverModel;
    private readonly careLinkModel;
    private readonly tokenModel;
    private readonly liveStatusModel;
    private readonly visionQueue;
    private readonly notificationsService;
    private readonly realtimeGateway;
    private readonly logger;
    constructor(imageRequestModel: Model<ImageRequestDocument>, visionResultModel: Model<VisionResultDocument>, alertModel: Model<AlertDocument>, alertReceiverModel: Model<AlertReceiverDocument>, careLinkModel: Model<CareLinkDocument>, tokenModel: Model<NotificationTokenDocument>, liveStatusModel: Model<UserLiveStatusDocument>, visionQueue: Queue, notificationsService: NotificationsService, realtimeGateway: RealtimeGateway);
    saveVisionResult(dto: {
        request_id: string;
        model_name: string;
        model_version: string;
        objects: any[];
        nearest_obstacle_cm?: number;
        risk_level?: string;
        summary_text?: string;
    }): Promise<{
        ok: boolean;
        duplicate: boolean;
        error?: undefined;
    } | {
        ok: boolean;
        error: string;
        duplicate?: undefined;
    } | {
        ok: boolean;
        duplicate?: undefined;
        error?: undefined;
    }>;
    private createAlertFromVision;
    retryJob(requestId: string): Promise<{
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
        error?: undefined;
    }>;
}
