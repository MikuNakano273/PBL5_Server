import { Model, Types } from 'mongoose';
import { Alert, AlertDocument } from "../../database/schemas/alert.schema";
export declare class AlertsService {
    private readonly alertModel;
    constructor(alertModel: Model<AlertDocument>);
    listByBlindUser(blindUserId: string, page: number, limit: number): Promise<{
        items: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Alert, {}, {}> & Alert & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        }> & Required<{
            _id: Types.ObjectId;
        }>)[];
        page: number;
        limit: number;
        total: number;
    }>;
    recentAlerts(blindUserId: string, limit?: number): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Alert, {}, {}> & Alert & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>)[]>;
    todayStats(blindUserId: string): Promise<{
        total: number;
        high: number;
        medium: number;
        low: number;
        date: string;
    }>;
    createDangerAlert(input: {
        blind_user_id: string;
        device_id: string;
        image_request_id?: string;
        distance_cm?: number;
        lat?: number;
        lng?: number;
        title: string;
        message: string;
    }): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Alert, {}, {}> & Alert & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, Alert, {}, {}> & Alert & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
}
