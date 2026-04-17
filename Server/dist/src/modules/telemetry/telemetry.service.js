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
var TelemetryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const distance_telemetry_schema_1 = require("../../database/schemas/distance-telemetry.schema");
const alert_schema_1 = require("../../database/schemas/alert.schema");
const alert_receiver_schema_1 = require("../../database/schemas/alert-receiver.schema");
const care_link_schema_1 = require("../../database/schemas/care-link.schema");
const notification_token_schema_1 = require("../../database/schemas/notification-token.schema");
const live_status_service_1 = require("../realtime/live-status.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
const app_enums_1 = require("../../common/enums/app.enums");
let TelemetryService = TelemetryService_1 = class TelemetryService {
    telemetryModel;
    alertModel;
    alertReceiverModel;
    careLinkModel;
    tokenModel;
    liveStatus;
    realtimeGateway;
    notificationsService;
    logger = new common_1.Logger(TelemetryService_1.name);
    DANGER_CM = parseInt(process.env.ALERT_DISTANCE_DANGER_CM || '100', 10);
    constructor(telemetryModel, alertModel, alertReceiverModel, careLinkModel, tokenModel, liveStatus, realtimeGateway, notificationsService) {
        this.telemetryModel = telemetryModel;
        this.alertModel = alertModel;
        this.alertReceiverModel = alertReceiverModel;
        this.careLinkModel = careLinkModel;
        this.tokenModel = tokenModel;
        this.liveStatus = liveStatus;
        this.realtimeGateway = realtimeGateway;
        this.notificationsService = notificationsService;
    }
    async ingest(dto) {
        const shouldSave = await this.liveStatus.shouldSaveDistance(dto.blind_user_id, dto.distance_cm);
        let saved = null;
        if (shouldSave) {
            saved = await this.telemetryModel.create({
                device_id: new mongoose_2.Types.ObjectId(dto.device_id),
                blind_user_id: new mongoose_2.Types.ObjectId(dto.blind_user_id),
                distance_cm: dto.distance_cm,
                detected: dto.detected ?? true,
                sensor_type: dto.sensor_type ?? 'ultrasonic',
                recorded_at: new Date(dto.recorded_at),
            });
        }
        const safetyStatus = await this.liveStatus.updateDistanceStatus(dto.blind_user_id, dto.distance_cm);
        await this.liveStatus.markDeviceLastSeen(dto.device_id);
        this.realtimeGateway.emitToBlindUser(dto.blind_user_id, 'distance:updated', {
            distance_cm: dto.distance_cm,
            safety_status: safetyStatus,
        });
        if (dto.distance_cm < this.DANGER_CM) {
            const isDup = await this.liveStatus.isDuplicateAlert(dto.blind_user_id, app_enums_1.AlertType.OBSTACLE_DANGER);
            if (!isDup) {
                await this.createDangerAlert(dto);
            }
        }
        return { saved: !!saved, safety_status: safetyStatus };
    }
    async createDangerAlert(dto) {
        const alert = await this.alertModel.create({
            blind_user_id: new mongoose_2.Types.ObjectId(dto.blind_user_id),
            device_id: new mongoose_2.Types.ObjectId(dto.device_id),
            alert_type: app_enums_1.AlertType.OBSTACLE_DANGER,
            risk_level: app_enums_1.AlertRiskLevel.HIGH,
            status: 'open',
            title: 'Phat hien vat can nguy hiem',
            message: `Co vat can o khoang cach ${dto.distance_cm}cm`,
            distance_cm: dto.distance_cm,
            triggered_at: new Date(),
        });
        const guardianLinks = await this.careLinkModel
            .find({ blind_user_id: new mongoose_2.Types.ObjectId(dto.blind_user_id), status: 'active', can_receive_alert: true })
            .lean();
        const guardianIds = guardianLinks.map((l) => l.guardian_user_id);
        if (guardianIds.length > 0) {
            await this.alertReceiverModel.insertMany(guardianIds.map((uid) => ({ alert_id: alert._id, user_id: uid })));
            const tokens = await this.tokenModel
                .find({ user_id: { $in: guardianIds }, is_active: true })
                .lean();
            const fcmTokens = tokens.map((t) => t.token);
            if (fcmTokens.length > 0) {
                await this.notificationsService.sendPush(fcmTokens, {
                    title: 'Canh bao vat can',
                    body: `Co vat can o khoang cach ${dto.distance_cm}cm`,
                    alert_id: String(alert._id),
                });
            }
        }
        this.realtimeGateway.emitToBlindUser(dto.blind_user_id, 'alert:created', {
            alert_id: String(alert._id),
            alert_type: app_enums_1.AlertType.OBSTACLE_DANGER,
            risk_level: app_enums_1.AlertRiskLevel.HIGH,
            distance_cm: dto.distance_cm,
        });
    }
};
exports.TelemetryService = TelemetryService;
exports.TelemetryService = TelemetryService = TelemetryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(distance_telemetry_schema_1.DistanceTelemetry.name)),
    __param(1, (0, mongoose_1.InjectModel)(alert_schema_1.Alert.name)),
    __param(2, (0, mongoose_1.InjectModel)(alert_receiver_schema_1.AlertReceiver.name)),
    __param(3, (0, mongoose_1.InjectModel)(care_link_schema_1.CareLink.name)),
    __param(4, (0, mongoose_1.InjectModel)(notification_token_schema_1.NotificationToken.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        live_status_service_1.LiveStatusService,
        realtime_gateway_1.RealtimeGateway,
        notifications_service_1.NotificationsService])
], TelemetryService);
//# sourceMappingURL=telemetry.service.js.map