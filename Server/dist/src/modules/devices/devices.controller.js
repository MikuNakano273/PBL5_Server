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
exports.DevicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const devices_service_1 = require("./devices.service");
class HeartbeatDto {
    device_id;
    battery;
}
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], HeartbeatDto.prototype, "device_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], HeartbeatDto.prototype, "battery", void 0);
let DevicesController = class DevicesController {
    devicesService;
    constructor(devicesService) {
        this.devicesService = devicesService;
    }
    heartbeat(dto, req) {
        const ip = req.ip || req.headers['x-forwarded-for'];
        return this.devicesService.heartbeat(dto.device_id, dto.battery, ip);
    }
    getConfig(deviceId) {
        return this.devicesService.getConfig(deviceId);
    }
    findOne(deviceId) {
        return this.devicesService.findOne(deviceId);
    }
};
exports.DevicesController = DevicesController;
__decorate([
    (0, common_1.Post)('cane/v1/heartbeat'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [HeartbeatDto, Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Get)('cane/v1/devices/:deviceId/config'),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Get)('mobile/v1/devices/:deviceId'),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "findOne", null);
exports.DevicesController = DevicesController = __decorate([
    (0, swagger_1.ApiTags)('Cane Devices'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [devices_service_1.DevicesService])
], DevicesController);
//# sourceMappingURL=devices.controller.js.map