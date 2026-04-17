import { Model, Types } from 'mongoose';
import { Device, DeviceDocument } from "../../database/schemas/device.schema";
import { UserLiveStatusDocument } from "../../database/schemas/user-live-status.schema";
export declare class DevicesService {
    private readonly deviceModel;
    private readonly liveStatusModel;
    constructor(deviceModel: Model<DeviceDocument>, liveStatusModel: Model<UserLiveStatusDocument>);
    findOne(deviceId: string): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Device, {}, {}> & Device & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>>;
    heartbeat(deviceId: string, battery?: number, ip?: string): Promise<{
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
}
