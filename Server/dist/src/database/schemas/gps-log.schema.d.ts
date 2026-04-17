import { HydratedDocument, Types } from 'mongoose';
export type GpsLogDocument = HydratedDocument<GpsLog>;
export declare class GpsLog {
    device_id: Types.ObjectId;
    blind_user_id: Types.ObjectId;
    lat: number;
    lng: number;
    location?: {
        type: 'Point';
        coordinates: [number, number];
    };
    accuracy?: number;
    speed?: number;
    heading?: number;
    recorded_at: Date;
}
export declare const GpsLogSchema: import("mongoose").Schema<GpsLog, import("mongoose").Model<GpsLog, any, any, any, import("mongoose").Document<unknown, any, GpsLog, any, {}> & GpsLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, GpsLog, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<GpsLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<GpsLog> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
