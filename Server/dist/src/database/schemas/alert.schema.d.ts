import { HydratedDocument, Types } from 'mongoose';
import { AlertRiskLevel, AlertType } from "../../common/enums/app.enums";
export type AlertDocument = HydratedDocument<Alert>;
export declare class Alert {
    blind_user_id: Types.ObjectId;
    device_id: Types.ObjectId;
    image_request_id?: Types.ObjectId;
    alert_type: AlertType;
    risk_level: AlertRiskLevel;
    status: string;
    title: string;
    message: string;
    lat?: number;
    lng?: number;
    distance_cm?: number;
    triggered_at: Date;
    resolved_at?: Date;
}
export declare const AlertSchema: import("mongoose").Schema<Alert, import("mongoose").Model<Alert, any, any, any, import("mongoose").Document<unknown, any, Alert, any, {}> & Alert & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Alert, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Alert>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Alert> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
