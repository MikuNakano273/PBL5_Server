import { Model, Types } from 'mongoose';
import { CareLink, CareLinkDocument } from "../../database/schemas/care-link.schema";
export declare class CareLinksService {
    private readonly careLinkModel;
    constructor(careLinkModel: Model<CareLinkDocument>);
    getLinksForUser(userId: string, role: string): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, CareLink, {}, {}> & CareLink & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>)[]>;
    getGuardianIdsForBlindUser(blindUserId: string): Promise<string[]>;
}
