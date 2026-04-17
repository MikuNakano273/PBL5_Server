import { HydratedDocument, Types } from 'mongoose';
export type UserLiveStatusDocument = HydratedDocument<UserLiveStatus>;
export declare class UserLiveStatus {
    blind_user_id: Types.ObjectId;
    device_id?: Types.ObjectId;
    current_safety_status: string;
    nearest_distance_cm?: number;
    last_location?: {
        lat: number;
        lng: number;
        accuracy?: number;
    };
    last_alert_at?: Date;
    last_seen_at?: Date;
}
export declare const UserLiveStatusSchema: import("mongoose").Schema<UserLiveStatus, import("mongoose").Model<UserLiveStatus, any, any, any, import("mongoose").Document<unknown, any, UserLiveStatus, any, {}> & UserLiveStatus & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserLiveStatus, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<UserLiveStatus>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<UserLiveStatus> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
