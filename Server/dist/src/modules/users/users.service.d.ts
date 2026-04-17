import { Model } from 'mongoose';
import { UserDocument } from "../../database/schemas/user.schema";
export declare class UsersService {
    private readonly userModel;
    constructor(userModel: Model<UserDocument>);
    findById(id: string): Promise<any>;
    updateFcmToken(_userId: string, _token: string): Promise<{
        success: boolean;
    }>;
}
