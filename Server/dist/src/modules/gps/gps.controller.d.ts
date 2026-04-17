import { GpsService } from './gps.service';
declare class GpsIngestDto {
    device_id: string;
    blind_user_id: string;
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    recorded_at: string;
}
export declare class GpsController {
    private readonly gpsService;
    constructor(gpsService: GpsService);
    ingest(dto: GpsIngestDto): Promise<{
        ok: boolean;
        id: string;
    }>;
    getHistory(blindUserId: string, limit?: string): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("../../database/schemas/gps-log.schema").GpsLog, {}, {}> & import("../../database/schemas/gps-log.schema").GpsLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
}
export {};
