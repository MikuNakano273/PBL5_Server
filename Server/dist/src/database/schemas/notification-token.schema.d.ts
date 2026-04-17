import { HydratedDocument, Types } from 'mongoose';
export type NotificationTokenDocument = HydratedDocument<NotificationToken>;
export declare class NotificationToken {
    user_id: Types.ObjectId;
    platform: string;
    token: string;
    is_active: boolean;
    last_used_at?: Date;
}
export declare const NotificationTokenSchema: import("mongoose").Schema<NotificationToken, import("mongoose").Model<NotificationToken, any, any, any, import("mongoose").Document<unknown, any, NotificationToken, any, {}> & NotificationToken & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, NotificationToken, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<NotificationToken>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<NotificationToken> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
