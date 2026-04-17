import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    listUsers(page?: string, limit?: string): Promise<{
        items: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("../../database/schemas/user.schema").User, {}, {}> & import("../../database/schemas/user.schema").User & {
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
    listDevices(page?: string, limit?: string): Promise<{
        items: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("../../database/schemas/device.schema").Device, {}, {}> & import("../../database/schemas/device.schema").Device & {
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
    listVisionRequests(page?: string, limit?: string): Promise<{
        items: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("../../database/schemas/image-request.schema").ImageRequest, {}, {}> & import("../../database/schemas/image-request.schema").ImageRequest & {
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
    listAlerts(page?: string, limit?: string): Promise<{
        items: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("../../database/schemas/alert.schema").Alert, {}, {}> & import("../../database/schemas/alert.schema").Alert & {
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
