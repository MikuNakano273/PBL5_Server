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
var OfflineDeviceJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineDeviceJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const device_schema_1 = require("../database/schemas/device.schema");
const alert_schema_1 = require("../database/schemas/alert.schema");
const alert_receiver_schema_1 = require("../database/schemas/alert-receiver.schema");
const care_link_schema_1 = require("../database/schemas/care-link.schema");
const notification_token_schema_1 = require("../database/schemas/notification-token.schema");
const user_live_status_schema_1 = require("../database/schemas/user-live-status.schema");
const notifications_service_1 = require("../modules/notifications/notifications.service");
const realtime_gateway_1 = require("../modules/realtime/realtime.gateway");
const app_enums_1 = require("../common/enums/app.enums");
let OfflineDeviceJob = OfflineDeviceJob_1 = class OfflineDeviceJob {
    deviceModel;
    alertModel;
    alertReceiverModel;
    careLinkModel;
    tokenModel;
    liveStatusModel;
    notificationsService;
    realtimeGateway;
    logger = new common_1.Logger(OfflineDeviceJob_1.name);
    OFFLINE_SECS = parseInt(process.env.DEVICE_OFFLINE_THRESHOLD_SECONDS || '60', 10);
    constructor(deviceModel, alertModel, alertReceiverModel, careLinkModel, tokenModel, liveStatusModel, notificationsService, realtimeGateway) {
        this.deviceModel = deviceModel;
        this.alertModel = alertModel;
        this.alertReceiverModel = alertReceiverModel;
        this.careLinkModel = careLinkModel;
        this.tokenModel = tokenModel;
        this.liveStatusModel = liveStatusModel;
        this.notificationsService = notificationsService;
        this.realtimeGateway = realtimeGateway;
    }
    async checkOfflineDevices() {
        const threshold = new Date(Date.now() - this.OFFLINE_SECS * 1000);
        const offlineDevices = await this.deviceModel.find({
            status: 'active',
            last_seen_at: { $lt: threshold },
        }).lean();
        for (const device of offlineDevices) {
            const blindUserId = String(device.owner_blind_user_id);
            this.logger.warn(`Device ${device.device_code} offline`);
            await this.deviceModel.findByIdAndUpdate(device._id, { status: 'offline' });
            await this.liveStatusModel.findOneAndUpdate({ blind_user_id: device.owner_blind_user_id }, { current_safety_status: 'offline', updated_at: new Date() }, { upsert: true });
            const recentOffline = await this.alertModel.findOne({
                device_id: device._id,
                alert_type: app_enums_1.AlertType.DEVICE_OFFLINE,
                triggered_at: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
            }).lean();
            if (recentOffline)
                continue;
            const alert = await this.alertModel.create({
                blind_user_id: device.owner_blind_user_id,
                device_id: device._id,
                alert_type: app_enums_1.AlertType.DEVICE_OFFLINE,
                risk_level: app_enums_1.AlertRiskLevel.MEDIUM,
                status: 'open',
                title: 'Thiet bi mat ket noi',
                message: `Gay ${device.device_code} khong gui tin hieu trong ${this.OFFLINE_SECS}s`,
                triggered_at: new Date(),
            });
            const guardianLinks = await this.careLinkModel
                .find({ blind_user_id: device.owner_blind_user_id, status: 'active', can_receive_alert: true })
                .lean();
            const guardianIds = guardianLinks.map((l) => l.guardian_user_id);
            if (guardianIds.length > 0) {
                await this.alertReceiverModel.insertMany(guardianIds.map((uid) => ({ alert_id: alert._id, user_id: uid })));
                const tokens = await this.tokenModel.find({ user_id: { $in: guardianIds }, is_active: true }).lean();
                const fcmTokens = tokens.map((t) => t.token);
                if (fcmTokens.length > 0) {
                    await this.notificationsService.sendPush(fcmTokens, {
                        title: 'Thiet bi mat ket noi',
                        body: `Gay ${device.device_code} offline`,
                        alert_id: String(alert._id),
                    });
                }
            }
            this.realtimeGateway.emitToBlindUser(blindUserId, 'alert:created', {
                alert_id: String(alert._id),
                alert_type: app_enums_1.AlertType.DEVICE_OFFLINE,
            });
        }
    }
};
exports.OfflineDeviceJob = OfflineDeviceJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OfflineDeviceJob.prototype, "checkOfflineDevices", null);
exports.OfflineDeviceJob = OfflineDeviceJob = OfflineDeviceJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(device_schema_1.Device.name)),
    __param(1, (0, mongoose_1.InjectModel)(alert_schema_1.Alert.name)),
    __param(2, (0, mongoose_1.InjectModel)(alert_receiver_schema_1.AlertReceiver.name)),
    __param(3, (0, mongoose_1.InjectModel)(care_link_schema_1.CareLink.name)),
    __param(4, (0, mongoose_1.InjectModel)(notification_token_schema_1.NotificationToken.name)),
    __param(5, (0, mongoose_1.InjectModel)(user_live_status_schema_1.UserLiveStatus.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        notifications_service_1.NotificationsService,
        realtime_gateway_1.RealtimeGateway])
], OfflineDeviceJob);
//# sourceMappingURL=offline-device.job.js.map