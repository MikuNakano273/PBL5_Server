import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { UserDocument } from "../../database/schemas/user.schema";
import { RefreshTokenDocument } from "../../database/schemas/refresh-token.schema";
export declare class AuthService {
    private readonly userModel;
    private readonly refreshTokenModel;
    private readonly jwtService;
    constructor(userModel: Model<UserDocument>, refreshTokenModel: Model<RefreshTokenDocument>, jwtService: JwtService);
    login(email: string, password: string, deviceInfo?: Record<string, string>): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: string;
            email: string;
            role: import("../../common/enums/app.enums").UserRole;
            full_name: string;
        };
    }>;
    refresh(rawRefreshToken: string): Promise<{
        access_token: string;
    }>;
    revokeRefreshToken(rawRefreshToken: string): Promise<void>;
    hashPassword(plain: string): Promise<string>;
    private generateRefreshToken;
}
