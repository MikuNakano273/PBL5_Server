import { Model, Types } from 'mongoose';
import { GpsLog, GpsLogDocument } from "../../database/schemas/gps-log.schema";
import { LiveStatusService } from '../realtime/live-status.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
export declare class GpsService {
    private readonly gpsModel;
    private readonly liveStatus;
    private readonly realtimeGateway;
    constructor(gpsModel: Model<GpsLogDocument>, liveStatus: LiveStatusService, realtimeGateway: RealtimeGateway);
    ingest(dto: {
        device_id: string;
        blind_user_id: string;
        lat: number;
        lng: number;
        accuracy?: number;
        speed?: number;
        heading?: number;
        recorded_at: string;
    }): Promise<{
        ok: boolean;
        id: string;
    }>;
    getHistory(blindUserId: string, limit?: number): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, GpsLog, {}, {}> & GpsLog & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>)[]>;
}
