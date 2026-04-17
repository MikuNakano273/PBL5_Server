import { HydratedDocument, Types } from 'mongoose';
import { DeviceStatus } from "../../common/enums/app.enums";
export type DeviceDocument = HydratedDocument<Device>;
export declare class Device {
    serial_number: string;
    device_code: string;
    owner_blind_user_id: Types.ObjectId;
    name: string;
    firmware_version?: string;
    status: DeviceStatus;
    last_seen_at?: Date;
    last_battery?: number;
    last_known_ip?: string;
    device_secret_hash?: string;
}
export declare const DeviceSchema: import("mongoose").Schema<Device, import("mongoose").Model<Device, any, any, any, import("mongoose").Document<unknown, any, Device, any, {}> & Device & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Device, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Device>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Device> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
