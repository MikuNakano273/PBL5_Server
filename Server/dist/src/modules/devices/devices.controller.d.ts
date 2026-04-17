import { DevicesService } from './devices.service';
declare class HeartbeatDto {
    device_id: string;
    battery?: number;
}
export declare class DevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    heartbeat(dto: HeartbeatDto, req: any): Promise<{
        ok: boolean;
    }>;
    getConfig(deviceId: string): Promise<{
        device_id: string;
        heartbeat_interval_ms: number;
        gps_interval_ms: number;
        telemetry_interval_ms: number;
        danger_distance_cm: number;
        warning_distance_cm: number;
    }>;
    findOne(deviceId: string): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("../../database/schemas/device.schema").Device, {}, {}> & import("../../database/schemas/device.schema").Device & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
}
export {};
