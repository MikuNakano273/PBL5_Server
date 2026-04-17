"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LiveStatusService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStatusService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ioredis_1 = require("ioredis");
const user_live_status_schema_1 = require("../../database/schemas/user-live-status.schema");
let LiveStatusService = LiveStatusService_1 = class LiveStatusService {
    liveStatusModel;
    logger = new common_1.Logger(LiveStatusService_1.name);
    redis;
    DANGER_CM = parseInt(process.env.ALERT_DISTANCE_DANGER_CM || '100', 10);
    WARNING_CM = parseInt(process.env.ALERT_DISTANCE_WARNING_CM || '150', 10);
    OFFLINE_SECS = parseInt(process.env.DEVICE_OFFLINE_THRESHOLD_SECONDS || '60', 10);
    constructor(liveStatusModel) {
        this.liveStatusModel = liveStatusModel;
        this.redis = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || undefined,
            db: parseInt(process.env.REDIS_DB || '0', 10),
        });
    }
    onModuleInit() {
        this.redis.on('error', (e) => this.logger.error('Redis error', e));
    }
    async updateDistanceStatus(blindUserId, distanceCm) {
        const key = `user:${blindUserId}:latest_distance`;
        await this.redis.setex(key, 300, String(distanceCm));
        const status = this.computeSafetyFromDistance(distanceCm);
        await this.redis.setex(`user:${blindUserId}:current_status`, 300, status);
        await this.liveStatusModel.findOneAndUpdate({ blind_user_id: new mongoose_2.Types.ObjectId(blindUserId) }, {
            nearest_distance_cm: distanceCm,
            current_safety_status: status,
            last_seen_at: new Date(),
            updated_at: new Date(),
        }, { upsert: true });
        return status;
    }
    async updateLocationStatus(blindUserId, lat, lng, accuracy) {
        const loc = JSON.stringify({ lat, lng, accuracy });
        await this.redis.setex(`user:${blindUserId}:latest_location`, 300, loc);
        await this.liveStatusModel.findOneAndUpdate({ blind_user_id: new mongoose_2.Types.ObjectId(blindUserId) }, { last_location: { lat, lng, accuracy }, last_seen_at: new Date(), updated_at: new Date() }, { upsert: true });
    }
    async markDeviceLastSeen(deviceId) {
        await this.redis.setex(`device:${deviceId}:last_seen`, this.OFFLINE_SECS * 3, Date.now().toString());
    }
    async isDeviceOffline(deviceId) {
        const val = await this.redis.get(`device:${deviceId}:last_seen`);
        if (!val)
            return true;
        return Date.now() - Number(val) > this.OFFLINE_SECS * 1000;
    }
    async shouldSaveDistance(blindUserId, newDistance) {
        const SAMPLING_MIN_MS = parseInt(process.env.DISTANCE_SAMPLING_MIN_MS || '1500', 10);
        const MIN_DELTA_CM = 10;
        const key = `device:${blindUserId}:last_saved_distance_at`;
        const lastKey = `user:${blindUserId}:latest_distance`;
        const [lastSavedAt, lastDist] = await Promise.all([
            this.redis.get(key),
            this.redis.get(lastKey),
        ]);
        const now = Date.now();
        const timePassed = !lastSavedAt || now - Number(lastSavedAt) >= SAMPLING_MIN_MS;
        const distChanged = !lastDist || Math.abs(newDistance - Number(lastDist)) >= MIN_DELTA_CM;
        if (timePassed || distChanged) {
            await this.redis.setex(key, 600, String(now));
            return true;
        }
        return false;
    }
    async isDuplicateAlert(blindUserId, alertType) {
        const DEDUP_SECS = parseInt(process.env.ALERT_DEDUP_SECONDS || '30', 10);
        const key = `alert_dedup:${blindUserId}:${alertType}`;
        const set = await this.redis.set(key, '1', 'EX', DEDUP_SECS, 'NX');
        return set === null;
    }
    async getDashboardStatus(blindUserId) {
        const [distRaw, locRaw, statusRaw] = await Promise.all([
            this.redis.get(`user:${blindUserId}:latest_distance`),
            this.redis.get(`user:${blindUserId}:latest_location`),
            this.redis.get(`user:${blindUserId}:current_status`),
        ]);
        return {
            nearest_distance_cm: distRaw !== null ? Number(distRaw) : null,
            last_location: locRaw ? JSON.parse(locRaw) : null,
            current_safety_status: statusRaw || 'unknown',
        };
    }
    computeSafetyFromDistance(cm) {
        if (cm < this.DANGER_CM)
            return 'danger';
        if (cm < this.WARNING_CM)
            return 'warning';
        return 'safe';
    }
};
exports.LiveStatusService = LiveStatusService;
exports.LiveStatusService = LiveStatusService = LiveStatusService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_live_status_schema_1.UserLiveStatus.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], LiveStatusService);
//# sourceMappingURL=live-status.service.js.map