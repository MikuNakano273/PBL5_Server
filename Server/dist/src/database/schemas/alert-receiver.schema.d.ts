import { HydratedDocument, Types } from 'mongoose';
export type AlertReceiverDocument = HydratedDocument<AlertReceiver>;
export declare class AlertReceiver {
    alert_id: Types.ObjectId;
    user_id: Types.ObjectId;
    is_push_sent: boolean;
    push_sent_at?: Date;
    viewed_at?: Date;
    acknowledged_at?: Date;
}
export declare const AlertReceiverSchema: import("mongoose").Schema<AlertReceiver, import("mongoose").Model<AlertReceiver, any, any, any, import("mongoose").Document<unknown, any, AlertReceiver, any, {}> & AlertReceiver & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AlertReceiver, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AlertReceiver>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AlertReceiver> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
