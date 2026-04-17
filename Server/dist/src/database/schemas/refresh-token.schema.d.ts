import { HydratedDocument, Types } from 'mongoose';
export type RefreshTokenDocument = HydratedDocument<RefreshToken>;
export declare class RefreshToken {
    user_id: Types.ObjectId;
    token_hash: string;
    expires_at: Date;
    revoked_at?: Date;
    device_info?: Record<string, string>;
}
export declare const RefreshTokenSchema: import("mongoose").Schema<RefreshToken, import("mongoose").Model<RefreshToken, any, any, any, import("mongoose").Document<unknown, any, RefreshToken, any, {}> & RefreshToken & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, RefreshToken, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<RefreshToken>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<RefreshToken> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
