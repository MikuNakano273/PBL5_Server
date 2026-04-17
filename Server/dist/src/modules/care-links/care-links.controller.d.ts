import { CareLinksService } from './care-links.service';
export declare class CareLinksController {
    private readonly careLinksService;
    constructor(careLinksService: CareLinksService);
    getCareLinks(user: {
        userId: string;
        role: string;
    }): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("../../database/schemas/care-link.schema").CareLink, {}, {}> & import("../../database/schemas/care-link.schema").CareLink & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
}
