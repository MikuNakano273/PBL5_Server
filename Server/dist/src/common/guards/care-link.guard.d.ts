import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Model } from 'mongoose';
import { CareLinkDocument } from "../../database/schemas/care-link.schema";
export declare class CareLinkGuard implements CanActivate {
    private readonly careLinkModel;
    constructor(careLinkModel: Model<CareLinkDocument>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
