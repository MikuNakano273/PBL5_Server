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
exports.TelemetryController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const telemetry_service_1 = require("./telemetry.service");
class DistanceIngestDto {
    device_id;
    blind_user_id;
    distance_cm;
    detected;
    sensor_type;
    recorded_at;
}
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], DistanceIngestDto.prototype, "device_id", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], DistanceIngestDto.prototype, "blind_user_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DistanceIngestDto.prototype, "distance_cm", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DistanceIngestDto.prototype, "detected", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DistanceIngestDto.prototype, "sensor_type", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DistanceIngestDto.prototype, "recorded_at", void 0);
let TelemetryController = class TelemetryController {
    telemetryService;
    constructor(telemetryService) {
        this.telemetryService = telemetryService;
    }
    ingest(dto) {
        return this.telemetryService.ingest(dto);
    }
};
exports.TelemetryController = TelemetryController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DistanceIngestDto]),
    __metadata("design:returntype", void 0)
], TelemetryController.prototype, "ingest", null);
exports.TelemetryController = TelemetryController = __decorate([
    (0, common_1.Controller)('cane/v1/telemetry/distance'),
    __metadata("design:paramtypes", [telemetry_service_1.TelemetryService])
], TelemetryController);
//# sourceMappingURL=telemetry.controller.js.map