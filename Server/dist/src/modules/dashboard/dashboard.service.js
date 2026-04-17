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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const alert_schema_1 = require("../../database/schemas/alert.schema");
const device_schema_1 = require("../../database/schemas/device.schema");
const user_live_status_schema_1 = require("../../database/schemas/user-live-status.schema");
const live_status_service_1 = require("../realtime/live-status.service");
let DashboardService = class DashboardService {
    alertModel;
    deviceModel;
    liveStatusModel;
    liveStatusService;
    constructor(alertModel, deviceModel, liveStatusModel, liveStatusService) {
        this.alertModel = alertModel;
        this.deviceModel = deviceModel;
        this.liveStatusModel = liveStatusModel;
        this.liveStatusService = liveStatusService;
    }
    async getDashboard(blindUserId) {
        const blindObjectId = new mongoose_2.Types.ObjectId(blindUserId);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const [todayAlerts, recentAlerts, liveStatus, redisStatus] = await Promise.all([
            this.alertModel.countDocuments({ blind_user_id: blindObjectId, triggered_at: { $gte: startOfDay } }),
            this.alertModel.find({ blind_user_id: blindObjectId }).sort({ triggered_at: -1 }).limit(5).lean(),
            this.liveStatusModel.findOne({ blind_user_id: blindObjectId }).lean(),
            this.liveStatusService.getDashboardStatus(blindUserId),
        ]);
        let device = null;
        if (liveStatus?.device_id) {
            device = await this.deviceModel.findById(liveStatus.device_id).select('serial_number status last_seen_at last_battery').lean();
        }
        const safetyStatus = redisStatus.current_safety_status || liveStatus?.current_safety_status || 'unknown';
        return {
            blind_user_id: blindUserId,
            is_safe: safetyStatus === 'safe',
            current_safety_status: safetyStatus,
            nearest_distance_cm: redisStatus.nearest_distance_cm ?? liveStatus?.nearest_distance_cm ?? null,
            last_location: redisStatus.last_location ?? liveStatus?.last_location ?? null,
            today_alert_count: todayAlerts,
            recent_alerts: recentAlerts,
            device_last_seen_at: device?.last_seen_at ?? liveStatus?.last_seen_at ?? null,
            device_battery: device?.last_battery ?? null,
            last_updated_at: new Date().toISOString(),
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(alert_schema_1.Alert.name)),
    __param(1, (0, mongoose_1.InjectModel)(device_schema_1.Device.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_live_status_schema_1.UserLiveStatus.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        live_status_service_1.LiveStatusService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map