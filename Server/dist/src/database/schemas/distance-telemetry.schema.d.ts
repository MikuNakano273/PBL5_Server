import { HydratedDocument, Types } from 'mongoose';
export type DistanceTelemetryDocument = HydratedDocument<DistanceTelemetry>;
export declare class DistanceTelemetry {
    device_id: Types.ObjectId;
    blind_user_id: Types.ObjectId;
    distance_cm: number;
    detected: boolean;
    sensor_type: string;
    recorded_at: Date;
}
export declare const DistanceTelemetrySchema: import("mongoose").Schema<DistanceTelemetry, import("mongoose").Model<DistanceTelemetry, any, any, any, import("mongoose").Document<unknown, any, DistanceTelemetry, any, {}> & DistanceTelemetry & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, DistanceTelemetry, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<DistanceTelemetry>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<DistanceTelemetry> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
