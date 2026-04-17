import { HydratedDocument, Types } from 'mongoose';
export type CareLinkDocument = HydratedDocument<CareLink>;
export declare class CareLink {
    blind_user_id: Types.ObjectId;
    guardian_user_id: Types.ObjectId;
    relation: string;
    status: string;
    can_view_live_location: boolean;
    can_receive_alert: boolean;
}
export declare const CareLinkSchema: import("mongoose").Schema<CareLink, import("mongoose").Model<CareLink, any, any, any, import("mongoose").Document<unknown, any, CareLink, any, {}> & CareLink & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CareLink, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<CareLink>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<CareLink> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
