import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserLiveStatusDocument } from "../../database/schemas/user-live-status.schema";
export declare class LiveStatusService implements OnModuleInit {
    private readonly liveStatusModel;
    private readonly logger;
    private redis;
    private readonly DANGER_CM;
    private readonly WARNING_CM;
    private readonly OFFLINE_SECS;
    constructor(liveStatusModel: Model<UserLiveStatusDocument>);
    onModuleInit(): void;
    updateDistanceStatus(blindUserId: string, distanceCm: number): Promise<string>;
    updateLocationStatus(blindUserId: string, lat: number, lng: number, accuracy?: number): Promise<void>;
    markDeviceLastSeen(deviceId: string): Promise<void>;
    isDeviceOffline(deviceId: string): Promise<boolean>;
    shouldSaveDistance(blindUserId: string, newDistance: number): Promise<boolean>;
    isDuplicateAlert(blindUserId: string, alertType: string): Promise<boolean>;
    getDashboardStatus(blindUserId: string): Promise<{
        nearest_distance_cm: number | null;
        last_location: any;
        current_safety_status: string;
    }>;
    private computeSafetyFromDistance;
}
