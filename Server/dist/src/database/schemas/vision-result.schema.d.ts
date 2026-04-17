import { HydratedDocument, Types } from 'mongoose';
export type VisionResultDocument = HydratedDocument<VisionResult>;
interface DetectedObject {
    label: string;
    confidence: number;
    bbox?: number[];
}
export declare class VisionResult {
    image_request_id: Types.ObjectId;
    model_name: string;
    model_version: string;
    objects: DetectedObject[];
    nearest_obstacle_cm?: number;
    risk_level?: string;
    summary_text?: string;
    processed_at: Date;
}
export declare const VisionResultSchema: import("mongoose").Schema<VisionResult, import("mongoose").Model<VisionResult, any, any, any, import("mongoose").Document<unknown, any, VisionResult, any, {}> & VisionResult & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, VisionResult, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<VisionResult>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<VisionResult> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export {};
