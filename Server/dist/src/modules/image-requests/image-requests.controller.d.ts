import { ImageRequestsService } from './image-requests.service';
declare class CreateImageRequestDto {
    device_id: string;
    blind_user_id: string;
    captured_at: string;
    distance_cm?: number;
}
declare class AttachImageDto {
    object_key: string;
}
export declare class ImageRequestsController {
    private readonly imageRequestsService;
    constructor(imageRequestsService: ImageRequestsService);
    create(dto: CreateImageRequestDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../../database/schemas/image-request.schema").ImageRequest, {}, {}> & import("../../database/schemas/image-request.schema").ImageRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("../../database/schemas/image-request.schema").ImageRequest, {}, {}> & import("../../database/schemas/image-request.schema").ImageRequest & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    attachImage(requestId: string, dto: AttachImageDto): Promise<{
        request_id: string;
        queued: boolean;
    }>;
}
export {};
