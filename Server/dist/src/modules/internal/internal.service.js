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
var InternalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const mongoose_2 = require("mongoose");
const image_request_schema_1 = require("../../database/schemas/image-request.schema");
const vision_result_schema_1 = require("../../database/schemas/vision-result.schema");
const alert_schema_1 = require("../../database/schemas/alert.schema");
const alert_receiver_schema_1 = require("../../database/schemas/alert-receiver.schema");
const care_link_schema_1 = require("../../database/schemas/care-link.schema");
const notification_token_schema_1 = require("../../database/schemas/notification-token.schema");
const user_live_status_schema_1 = require("../../database/schemas/user-live-status.schema");
const notifications_service_1 = require("../notifications/notifications.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const app_enums_1 = require("../../common/enums/app.enums");
let InternalService = InternalService_1 = class InternalService {
    imageRequestModel;
    visionResultModel;
    alertModel;
    alertReceiverModel;
    careLinkModel;
    tokenModel;
    liveStatusModel;
    visionQueue;
    notificationsService;
    realtimeGateway;
    logger = new common_1.Logger(InternalService_1.name);
    constructor(imageRequestModel, visionResultModel, alertModel, alertReceiverModel, careLinkModel, tokenModel, liveStatusModel, visionQueue, notificationsService, realtimeGateway) {
        this.imageRequestModel = imageRequestModel;
        this.visionResultModel = visionResultModel;
        this.alertModel = alertModel;
        this.alertReceiverModel = alertReceiverModel;
        this.careLinkModel = careLinkModel;
        this.tokenModel = tokenModel;
        this.liveStatusModel = liveStatusModel;
        this.visionQueue = visionQueue;
        this.notificationsService = notificationsService;
        this.realtimeGateway = realtimeGateway;
    }
    async saveVisionResult(dto) {
        const existing = await this.visionResultModel
            .findOne({ image_request_id: new mongoose_2.Types.ObjectId(dto.request_id) })
            .lean();
        if (existing)
            return { ok: true, duplicate: true };
        const req = await this.imageRequestModel.findById(dto.request_id);
        if (!req)
            return { ok: false, error: 'Request not found' };
        await this.visionResultModel.create({
            image_request_id: new mongoose_2.Types.ObjectId(dto.request_id),
            model_name: dto.model_name,
            model_version: dto.model_version,
            objects: dto.objects,
            nearest_obstacle_cm: dto.nearest_obstacle_cm,
            risk_level: dto.risk_level,
            summary_text: dto.summary_text,
            processed_at: new Date(),
        });
        req.status = 'done';
        req.ai_status = 'done';
        await req.save();
        if (dto.risk_level === app_enums_1.AlertRiskLevel.HIGH) {
            await this.createAlertFromVision(req, dto);
        }
        return { ok: true };
    }
    async createAlertFromVision(req, dto) {
        const blindUserId = String(req.blind_user_id);
        const alert = await this.alertModel.create({
            blind_user_id: req.blind_user_id,
            device_id: req.device_id,
            image_request_id: req._id,
            alert_type: app_enums_1.AlertType.AI_DETECTION_WARNING,
            risk_level: app_enums_1.AlertRiskLevel.HIGH,
            status: 'open',
            title: 'Phat hien vat can nguy hiem',
            message: dto.summary_text || 'Obstacle detected',
            distance_cm: dto.nearest_obstacle_cm,
            triggered_at: new Date(),
        });
        const guardianLinks = await this.careLinkModel
            .find({ blind_user_id: req.blind_user_id, status: 'active', can_receive_alert: true })
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
                    title: 'Phat hien vat can nguy hiem',
                    body: dto.summary_text || 'Obstacle detected',
                    alert_id: String(alert._id),
                });
            }
        }
        await this.liveStatusModel.findOneAndUpdate({ blind_user_id: req.blind_user_id }, { current_safety_status: 'danger', last_alert_at: new Date(), updated_at: new Date() }, { upsert: true });
        this.realtimeGateway.emitToBlindUser(blindUserId, 'alert:created', {
            alert_id: String(alert._id),
            risk_level: app_enums_1.AlertRiskLevel.HIGH,
            message: dto.summary_text,
        });
    }
    async retryJob(requestId) {
        const req = await this.imageRequestModel.findById(requestId);
        if (!req || !req.image_path)
            return { ok: false, error: 'No image attached' };
        await this.visionQueue.add('process-image', { request_id: requestId, object_key: req.image_path }, { attempts: 5, backoff: { type: 'exponential', delay: 3000 } });
        req.ai_status = 'queued';
        req.status = 'queued';
        await req.save();
        return { ok: true };
    }
};
exports.InternalService = InternalService;
exports.InternalService = InternalService = InternalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(image_request_schema_1.ImageRequest.name)),
    __param(1, (0, mongoose_1.InjectModel)(vision_result_schema_1.VisionResult.name)),
    __param(2, (0, mongoose_1.InjectModel)(alert_schema_1.Alert.name)),
    __param(3, (0, mongoose_1.InjectModel)(alert_receiver_schema_1.AlertReceiver.name)),
    __param(4, (0, mongoose_1.InjectModel)(care_link_schema_1.CareLink.name)),
    __param(5, (0, mongoose_1.InjectModel)(notification_token_schema_1.NotificationToken.name)),
    __param(6, (0, mongoose_1.InjectModel)(user_live_status_schema_1.UserLiveStatus.name)),
    __param(7, (0, bullmq_1.InjectQueue)('vision-jobs')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        bullmq_2.Queue,
        notifications_service_1.NotificationsService,
        realtime_gateway_1.RealtimeGateway])
], InternalService);
//# sourceMappingURL=internal.service.js.map