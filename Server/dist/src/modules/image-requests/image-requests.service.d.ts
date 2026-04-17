import { Queue } from 'bullmq';
import { Model, Types } from 'mongoose';
import { ImageRequest, ImageRequestDocument } from "../../database/schemas/image-request.schema";
export declare class ImageRequestsService {
    private readonly imageRequestModel;
    private readonly visionQueue;
    constructor(imageRequestModel: Model<ImageRequestDocument>, visionQueue: Queue);
    create(dto: {
        device_id: string;
        blind_user_id: string;
        captured_at: string;
        distance_cm?: number;
    }): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, ImageRequest, {}, {}> & ImageRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, ImageRequest, {}, {}> & ImageRequest & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    attachImage(requestId: string, objectKey: string): Promise<{
        request_id: string;
        queued: boolean;
    }>;
}
