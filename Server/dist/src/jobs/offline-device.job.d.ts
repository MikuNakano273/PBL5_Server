import { Model } from 'mongoose';
import { DeviceDocument } from "../database/schemas/device.schema";
import { AlertDocument } from "../database/schemas/alert.schema";
import { AlertReceiverDocument } from "../database/schemas/alert-receiver.schema";
import { CareLinkDocument } from "../database/schemas/care-link.schema";
import { NotificationTokenDocument } from "../database/schemas/notification-token.schema";
import { UserLiveStatusDocument } from "../database/schemas/user-live-status.schema";
import { NotificationsService } from "../modules/notifications/notifications.service";
import { RealtimeGateway } from "../modules/realtime/realtime.gateway";
export declare class OfflineDeviceJob {
    private readonly deviceModel;
    private readonly alertModel;
    private readonly alertReceiverModel;
    private readonly careLinkModel;
    private readonly tokenModel;
    private readonly liveStatusModel;
    private readonly notificationsService;
    private readonly realtimeGateway;
    private readonly logger;
    private readonly OFFLINE_SECS;
    constructor(deviceModel: Model<DeviceDocument>, alertModel: Model<AlertDocument>, alertReceiverModel: Model<AlertReceiverDocument>, careLinkModel: Model<CareLinkDocument>, tokenModel: Model<NotificationTokenDocument>, liveStatusModel: Model<UserLiveStatusDocument>, notificationsService: NotificationsService, realtimeGateway: RealtimeGateway);
    checkOfflineDevices(): Promise<void>;
}
