import { HydratedDocument } from 'mongoose';
export type AuditLogDocument = HydratedDocument<AuditLog>;
export declare class AuditLog {
    actor_type: string;
    actor_id: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    metadata?: Record<string, unknown>;
}
export declare const AuditLogSchema: import("mongoose").Schema<AuditLog, import("mongoose").Model<AuditLog, any, any, any, import("mongoose").Document<unknown, any, AuditLog, any, {}> & AuditLog & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AuditLog, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AuditLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AuditLog> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
