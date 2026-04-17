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
exports.GpsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const gps_log_schema_1 = require("../../database/schemas/gps-log.schema");
const live_status_service_1 = require("../realtime/live-status.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
let GpsService = class GpsService {
    gpsModel;
    liveStatus;
    realtimeGateway;
    constructor(gpsModel, liveStatus, realtimeGateway) {
        this.gpsModel = gpsModel;
        this.liveStatus = liveStatus;
        this.realtimeGateway = realtimeGateway;
    }
    async ingest(dto) {
        const log = await this.gpsModel.create({
            device_id: new mongoose_2.Types.ObjectId(dto.device_id),
            blind_user_id: new mongoose_2.Types.ObjectId(dto.blind_user_id),
            lat: dto.lat,
            lng: dto.lng,
            location: { type: 'Point', coordinates: [dto.lng, dto.lat] },
            accuracy: dto.accuracy,
            speed: dto.speed,
            heading: dto.heading,
            recorded_at: new Date(dto.recorded_at),
        });
        await this.liveStatus.updateLocationStatus(dto.blind_user_id, dto.lat, dto.lng, dto.accuracy);
        await this.liveStatus.markDeviceLastSeen(dto.device_id);
        this.realtimeGateway.emitToBlindUser(dto.blind_user_id, 'location:updated', {
            lat: dto.lat,
            lng: dto.lng,
            accuracy: dto.accuracy,
        });
        return { ok: true, id: String(log._id) };
    }
    async getHistory(blindUserId, limit = 50) {
        return this.gpsModel
            .find({ blind_user_id: new mongoose_2.Types.ObjectId(blindUserId) })
            .sort({ recorded_at: -1 })
            .limit(limit)
            .lean();
    }
};
exports.GpsService = GpsService;
exports.GpsService = GpsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(gps_log_schema_1.GpsLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        live_status_service_1.LiveStatusService,
        realtime_gateway_1.RealtimeGateway])
], GpsService);
//# sourceMappingURL=gps.service.js.map