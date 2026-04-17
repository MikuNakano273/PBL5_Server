import { TelemetryService } from './telemetry.service';
declare class DistanceIngestDto {
    device_id: string;
    blind_user_id: string;
    distance_cm: number;
    detected?: boolean;
    sensor_type?: string;
    recorded_at: string;
}
export declare class TelemetryController {
    private readonly telemetryService;
    constructor(telemetryService: TelemetryService);
    ingest(dto: DistanceIngestDto): Promise<{
        saved: boolean;
        safety_status: string;
    }>;
}
export {};
