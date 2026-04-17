import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class InternalApiGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
