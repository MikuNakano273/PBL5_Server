import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboard(blindUserId: string): Promise<{
        blind_user_id: string;
        is_safe: boolean;
        current_safety_status: string;
        nearest_distance_cm: number | null;
        last_location: any;
        today_alert_count: number;
        recent_alerts: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("../../database/schemas/alert.schema").Alert, {}, {}> & import("../../database/schemas/alert.schema").Alert & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        device_last_seen_at: Date | null;
        device_battery: number | null;
        last_updated_at: string;
    }>;
}
