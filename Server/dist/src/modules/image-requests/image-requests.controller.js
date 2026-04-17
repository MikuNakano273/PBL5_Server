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
exports.ImageRequestsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const image_requests_service_1 = require("./image-requests.service");
class CreateImageRequestDto {
    device_id;
    blind_user_id;
    captured_at;
    distance_cm;
}
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], CreateImageRequestDto.prototype, "device_id", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], CreateImageRequestDto.prototype, "blind_user_id", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateImageRequestDto.prototype, "captured_at", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateImageRequestDto.prototype, "distance_cm", void 0);
class AttachImageDto {
    object_key;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttachImageDto.prototype, "object_key", void 0);
let ImageRequestsController = class ImageRequestsController {
    imageRequestsService;
    constructor(imageRequestsService) {
        this.imageRequestsService = imageRequestsService;
    }
    create(dto) {
        return this.imageRequestsService.create(dto);
    }
    attachImage(requestId, dto) {
        return this.imageRequestsService.attachImage(requestId, dto.object_key);
    }
};
exports.ImageRequestsController = ImageRequestsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateImageRequestDto]),
    __metadata("design:returntype", void 0)
], ImageRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':requestId/image'),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AttachImageDto]),
    __metadata("design:returntype", void 0)
], ImageRequestsController.prototype, "attachImage", null);
exports.ImageRequestsController = ImageRequestsController = __decorate([
    (0, common_1.Controller)('cane/v1/requests'),
    __metadata("design:paramtypes", [image_requests_service_1.ImageRequestsService])
], ImageRequestsController);
//# sourceMappingURL=image-requests.controller.js.map