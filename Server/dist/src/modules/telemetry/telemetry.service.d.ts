import { Model } from 'mongoose';
import { DistanceTelemetryDocument } from "../../database/schemas/distance-telemetry.schema";
import { AlertDocument } from "../../database/schemas/alert.schema";
import { AlertReceiverDocument } from "../../database/schemas/alert-receiver.schema";
import { CareLinkDocument } from "../../database/schemas/care-link.schema";
import { NotificationTokenDocument } from "../../database/schemas/notification-token.schema";
import { LiveStatusService } from '../realtime/live-status.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
export declare class TelemetryService {
    private readonly telemetryModel;
    private readonly alertModel;
    private readonly alertReceiverModel;
    private readonly careLinkModel;
    private readonly tokenModel;
    private readonly liveStatus;
    private readonly realtimeGateway;
    private readonly notificationsService;
    private readonly logger;
    private readonly DANGER_CM;
    constructor(telemetryModel: Model<DistanceTelemetryDocument>, alertModel: Model<AlertDocument>, alertReceiverModel: Model<AlertReceiverDocument>, careLinkModel: Model<CareLinkDocument>, tokenModel: Model<NotificationTokenDocument>, liveStatus: LiveStatusService, realtimeGateway: RealtimeGateway, notificationsService: NotificationsService);
    ingest(dto: {
        device_id: string;
        blind_user_id: string;
        distance_cm: number;
        detected?: boolean;
        sensor_type?: string;
        recorded_at: string;
    }): Promise<{
        saved: boolean;
        safety_status: string;
    }>;
    private createDangerAlert;
}
