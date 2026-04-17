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
exports.GpsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const gps_service_1 = require("./gps.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
class GpsIngestDto {
    device_id;
    blind_user_id;
    lat;
    lng;
    accuracy;
    speed;
    heading;
    recorded_at;
}
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], GpsIngestDto.prototype, "device_id", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], GpsIngestDto.prototype, "blind_user_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GpsIngestDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GpsIngestDto.prototype, "lng", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GpsIngestDto.prototype, "accuracy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GpsIngestDto.prototype, "speed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GpsIngestDto.prototype, "heading", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GpsIngestDto.prototype, "recorded_at", void 0);
let GpsController = class GpsController {
    gpsService;
    constructor(gpsService) {
        this.gpsService = gpsService;
    }
    ingest(dto) {
        return this.gpsService.ingest(dto);
    }
    getHistory(blindUserId, limit = '50') {
        return this.gpsService.getHistory(blindUserId, Number(limit));
    }
};
exports.GpsController = GpsController;
__decorate([
    (0, common_1.Post)('cane/v1/gps'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GpsIngestDto]),
    __metadata("design:returntype", void 0)
], GpsController.prototype, "ingest", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('mobile/v1/locations/:blindUserId/history'),
    __param(0, (0, common_1.Param)('blindUserId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GpsController.prototype, "getHistory", null);
exports.GpsController = GpsController = __decorate([
    (0, swagger_1.ApiTags)('GPS'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [gps_service_1.GpsService])
], GpsController);
//# sourceMappingURL=gps.controller.js.map