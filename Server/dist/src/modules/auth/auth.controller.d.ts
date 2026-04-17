import { AuthService } from './auth.service';
declare class LoginDto {
    email: string;
    password: string;
}
declare class RefreshDto {
    refresh_token: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: string;
            email: string;
            role: import("../../common/enums/app.enums").UserRole;
            full_name: string;
        };
    }>;
    refresh(dto: RefreshDto): Promise<{
        access_token: string;
    }>;
    logout(dto: RefreshDto): Promise<void>;
}
export {};
