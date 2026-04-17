import { AlertsService } from './alerts.service';
export declare class AlertsController {
    private readonly alertsService;
    constructor(alertsService: AlertsService);
    list(blindUserId: string, page?: string, limit?: string): Promise<{
        items: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("../../database/schemas/alert.schema").Alert, {}, {}> & import("../../database/schemas/alert.schema").Alert & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
    }>;
    recent(blindUserId: string): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("../../database/schemas/alert.schema").Alert, {}, {}> & import("../../database/schemas/alert.schema").Alert & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    todayStats(blindUserId: string): Promise<{
        total: number;
        high: number;
        medium: number;
        low: number;
        date: string;
    }>;
}
