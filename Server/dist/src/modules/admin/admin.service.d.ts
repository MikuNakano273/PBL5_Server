import { Model } from 'mongoose';
import { User, UserDocument } from "../../database/schemas/user.schema";
import { Device, DeviceDocument } from "../../database/schemas/device.schema";
import { ImageRequest, ImageRequestDocument } from "../../database/schemas/image-request.schema";
import { Alert, AlertDocument } from "../../database/schemas/alert.schema";
export declare class AdminService {
    private readonly userModel;
    private readonly deviceModel;
    private readonly imageRequestModel;
    private readonly alertModel;
    constructor(userModel: Model<UserDocument>, deviceModel: Model<DeviceDocument>, imageRequestModel: Model<ImageRequestDocument>, alertModel: Model<AlertDocument>);
    listUsers(page: number, limit: number): Promise<{
        items: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, User, {}, {}> & User & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
    }>;
    listDevices(page: number, limit: number): Promise<{
        items: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Device, {}, {}> & Device & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
    }>;
    listVisionRequests(page: number, limit: number): Promise<{
        items: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, ImageRequest, {}, {}> & ImageRequest & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
    }>;
    listAlerts(page: number, limit: number): Promise<{
        items: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Alert, {}, {}> & Alert & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
    }>;
}
