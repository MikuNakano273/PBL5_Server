import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Model } from 'mongoose';
import { DeviceDocument } from "../../database/schemas/device.schema";
export declare class DeviceAuthGuard implements CanActivate {
    private readonly deviceModel;
    constructor(deviceModel: Model<DeviceDocument>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
