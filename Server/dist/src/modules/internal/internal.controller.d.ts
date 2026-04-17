import { InternalService } from './internal.service';
declare class VisionResultDto {
    request_id: string;
    model_name: string;
    model_version: string;
    objects: any[];
    nearest_obstacle_cm?: number;
    risk_level?: string;
    summary_text?: string;
}
declare class RetryJobDto {
    request_id: string;
}
export declare class InternalController {
    private readonly internalService;
    constructor(internalService: InternalService);
    saveVisionResult(dto: VisionResultDto): Promise<{
        ok: boolean;
        duplicate: boolean;
        error?: undefined;
    } | {
        ok: boolean;
        error: string;
        duplicate?: undefined;
    } | {
        ok: boolean;
        duplicate?: undefined;
        error?: undefined;
    }>;
    retryJob(dto: RetryJobDto): Promise<{
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
        error?: undefined;
    }>;
}
export {};
