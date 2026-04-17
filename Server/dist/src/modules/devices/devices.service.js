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
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const device_schema_1 = require("../../database/schemas/device.schema");
const user_live_status_schema_1 = require("../../database/schemas/user-live-status.schema");
let DevicesService = class DevicesService {
    deviceModel;
    liveStatusModel;
    constructor(deviceModel, liveStatusModel) {
        this.deviceModel = deviceModel;
        this.liveStatusModel = liveStatusModel;
    }
    async findOne(deviceId) {
        const device = await this.deviceModel.findById(new mongoose_2.Types.ObjectId(deviceId)).lean();
        if (!device)
            throw new common_1.NotFoundException('Device not found');
        return device;
    }
    async heartbeat(deviceId, battery, ip) {
        const device = await this.deviceModel.findByIdAndUpdate(new mongoose_2.Types.ObjectId(deviceId), { last_seen_at: new Date(), ...(battery !== undefined && { last_battery: battery }), ...(ip && { last_known_ip: ip }) }, { new: true }).lean();
        if (!device)
            throw new common_1.NotFoundException('Device not found');
        await this.liveStatusModel.findOneAndUpdate({ blind_user_id: device.owner_blind_user_id }, { device_id: device._id, last_seen_at: new Date(), updated_at: new Date() }, { upsert: true });
        return { ok: true };
    }
    async getConfig(deviceId) {
        return {
            device_id: deviceId,
            heartbeat_interval_ms: parseInt(process.env.DEVICE_HEARTBEAT_INTERVAL_MS || '30000', 10),
            gps_interval_ms: parseInt(process.env.DEVICE_GPS_INTERVAL_MS || '5000', 10),
            telemetry_interval_ms: parseInt(process.env.DEVICE_TELEMETRY_INTERVAL_MS || '500', 10),
            danger_distance_cm: parseInt(process.env.ALERT_DISTANCE_DANGER_CM || '100', 10),
            warning_distance_cm: parseInt(process.env.ALERT_DISTANCE_WARNING_CM || '150', 10),
        };
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(device_schema_1.Device.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_live_status_schema_1.UserLiveStatus.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], DevicesService);
//# sourceMappingURL=devices.service.js.map