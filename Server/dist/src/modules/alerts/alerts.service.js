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
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const alert_schema_1 = require("../../database/schemas/alert.schema");
const app_enums_1 = require("../../common/enums/app.enums");
let AlertsService = class AlertsService {
    alertModel;
    constructor(alertModel) {
        this.alertModel = alertModel;
    }
    async listByBlindUser(blindUserId, page, limit) {
        const skip = (page - 1) * limit;
        const filter = { blind_user_id: new mongoose_2.Types.ObjectId(blindUserId) };
        const [items, total] = await Promise.all([
            this.alertModel.find(filter).sort({ triggered_at: -1 }).skip(skip).limit(limit).lean(),
            this.alertModel.countDocuments(filter),
        ]);
        return { items, page, limit, total };
    }
    async recentAlerts(blindUserId, limit = 10) {
        return this.alertModel
            .find({ blind_user_id: new mongoose_2.Types.ObjectId(blindUserId) })
            .sort({ triggered_at: -1 })
            .limit(limit)
            .lean();
    }
    async todayStats(blindUserId) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const blindObjectId = new mongoose_2.Types.ObjectId(blindUserId);
        const [total, high, medium] = await Promise.all([
            this.alertModel.countDocuments({ blind_user_id: blindObjectId, triggered_at: { $gte: startOfDay } }),
            this.alertModel.countDocuments({ blind_user_id: blindObjectId, triggered_at: { $gte: startOfDay }, risk_level: app_enums_1.AlertRiskLevel.HIGH }),
            this.alertModel.countDocuments({ blind_user_id: blindObjectId, triggered_at: { $gte: startOfDay }, risk_level: app_enums_1.AlertRiskLevel.MEDIUM }),
        ]);
        return { total, high, medium, low: total - high - medium, date: startOfDay.toISOString() };
    }
    async createDangerAlert(input) {
        return this.alertModel.create({
            blind_user_id: new mongoose_2.Types.ObjectId(input.blind_user_id),
            device_id: new mongoose_2.Types.ObjectId(input.device_id),
            image_request_id: input.image_request_id ? new mongoose_2.Types.ObjectId(input.image_request_id) : undefined,
            alert_type: app_enums_1.AlertType.OBSTACLE_DANGER,
            risk_level: app_enums_1.AlertRiskLevel.HIGH,
            status: 'open',
            title: input.title,
            message: input.message,
            distance_cm: input.distance_cm,
            lat: input.lat,
            lng: input.lng,
            triggered_at: new Date(),
        });
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(alert_schema_1.Alert.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map