import { UserRole } from '../enums/app.enums';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: UserRole[]) => import("@nestjs/common").CustomDecorator<string>;
