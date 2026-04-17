import { HydratedDocument, Types } from 'mongoose';
import { ImageRequestStatus } from "../../common/enums/app.enums";
export type ImageRequestDocument = HydratedDocument<ImageRequest>;
export declare class ImageRequest {
    request_code: string;
    device_id: Types.ObjectId;
    blind_user_id: Types.ObjectId;
    captured_at: Date;
    distance_cm?: number;
    gps_snapshot?: Record<string, unknown>;
    image_path?: string;
    status: ImageRequestStatus;
    ai_status: string;
    error_message?: string;
}
export declare const ImageRequestSchema: import("mongoose").Schema<ImageRequest, import("mongoose").Model<ImageRequest, any, any, any, import("mongoose").Document<unknown, any, ImageRequest, any, {}> & ImageRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ImageRequest, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ImageRequest>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ImageRequest> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
