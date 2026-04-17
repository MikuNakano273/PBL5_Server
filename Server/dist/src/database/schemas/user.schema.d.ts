import { HydratedDocument } from 'mongoose';
import { UserRole } from "../../common/enums/app.enums";
export type UserDocument = HydratedDocument<User>;
export declare class User {
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string;
    role: UserRole;
    status: string;
    avatar_url?: string;
    last_login_at?: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, import("mongoose").Document<unknown, any, User, any, {}> & User & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
