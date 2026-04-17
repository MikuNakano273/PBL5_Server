import { Model, Types } from 'mongoose';
import { Alert, AlertDocument } from "../../database/schemas/alert.schema";
import { DeviceDocument } from "../../database/schemas/device.schema";
import { UserLiveStatusDocument } from "../../database/schemas/user-live-status.schema";
import { LiveStatusService } from '../realtime/live-status.service';
export declare class DashboardService {
    private readonly alertModel;
    private readonly deviceModel;
    private readonly liveStatusModel;
    private readonly liveStatusService;
    constructor(alertModel: Model<AlertDocument>, deviceModel: Model<DeviceDocument>, liveStatusModel: Model<UserLiveStatusDocument>, liveStatusService: LiveStatusService);
    getDashboard(blindUserId: string): Promise<{
        blind_user_id: string;
        is_safe: boolean;
        current_safety_status: string;
        nearest_distance_cm: number | null;
        last_location: any;
        today_alert_count: number;
        recent_alerts: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Alert, {}, {}> & Alert & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        }> & Required<{
            _id: Types.ObjectId;
        }>)[];
        device_last_seen_at: Date | null;
        device_battery: number | null;
        last_updated_at: string;
    }>;
}
