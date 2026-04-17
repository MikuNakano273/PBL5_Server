import { Model } from 'mongoose';
import { AlertDocument } from "../database/schemas/alert.schema";
import { UserLiveStatusDocument } from "../database/schemas/user-live-status.schema";
export declare class RecomputeDailyStatsJob {
    private readonly alertModel;
    private readonly liveStatusModel;
    private readonly logger;
    constructor(alertModel: Model<AlertDocument>, liveStatusModel: Model<UserLiveStatusDocument>);
    recompute(): Promise<void>;
}
