import { Model } from 'mongoose';
import { DistanceTelemetryDocument } from "../database/schemas/distance-telemetry.schema";
import { GpsLogDocument } from "../database/schemas/gps-log.schema";
export declare class CleanupTelemetryJob {
    private readonly telemetryModel;
    private readonly gpsModel;
    private readonly logger;
    constructor(telemetryModel: Model<DistanceTelemetryDocument>, gpsModel: Model<GpsLogDocument>);
    cleanupOldRecords(): Promise<void>;
}
