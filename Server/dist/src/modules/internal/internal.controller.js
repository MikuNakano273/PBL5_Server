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
exports.InternalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const internal_api_guard_1 = require("../../common/guards/internal-api.guard");
const internal_service_1 = require("./internal.service");
class VisionResultDto {
    request_id;
    model_name;
    model_version;
    objects;
    nearest_obstacle_cm;
    risk_level;
    summary_text;
}
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], VisionResultDto.prototype, "request_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VisionResultDto.prototype, "model_name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VisionResultDto.prototype, "model_version", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], VisionResultDto.prototype, "objects", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], VisionResultDto.prototype, "nearest_obstacle_cm", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VisionResultDto.prototype, "risk_level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VisionResultDto.prototype, "summary_text", void 0);
class RetryJobDto {
    request_id;
}
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], RetryJobDto.prototype, "request_id", void 0);
let InternalController = class InternalController {
    internalService;
    constructor(internalService) {
        this.internalService = internalService;
    }
    saveVisionResult(dto) {
        return this.internalService.saveVisionResult(dto);
    }
    retryJob(dto) {
        return this.internalService.retryJob(dto.request_id);
    }
};
exports.InternalController = InternalController;
__decorate([
    (0, common_1.Post)('vision/results'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VisionResultDto]),
    __metadata("design:returntype", void 0)
], InternalController.prototype, "saveVisionResult", null);
__decorate([
    (0, common_1.Post)('jobs/retry'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RetryJobDto]),
    __metadata("design:returntype", void 0)
], InternalController.prototype, "retryJob", null);
exports.InternalController = InternalController = __decorate([
    (0, swagger_1.ApiTags)('Internal'),
    (0, common_1.UseGuards)(internal_api_guard_1.InternalApiGuard),
    (0, common_1.Controller)('internal/v1'),
    __metadata("design:paramtypes", [internal_service_1.InternalService])
], InternalController);
//# sourceMappingURL=internal.controller.js.map