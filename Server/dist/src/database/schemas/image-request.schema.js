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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageRequestSchema = exports.ImageRequest = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const app_enums_1 = require("../../common/enums/app.enums");
let ImageRequest = class ImageRequest {
    request_code;
    device_id;
    blind_user_id;
    captured_at;
    distance_cm;
    gps_snapshot;
    image_path;
    status;
    ai_status;
    error_message;
};
exports.ImageRequest = ImageRequest;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], ImageRequest.prototype, "request_code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ImageRequest.prototype, "device_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ImageRequest.prototype, "blind_user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], ImageRequest.prototype, "captured_at", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], ImageRequest.prototype, "distance_cm", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], ImageRequest.prototype, "gps_snapshot", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ImageRequest.prototype, "image_path", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: app_enums_1.ImageRequestStatus, default: app_enums_1.ImageRequestStatus.CREATED, index: true }),
    __metadata("design:type", String)
], ImageRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'pending', index: true }),
    __metadata("design:type", String)
], ImageRequest.prototype, "ai_status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ImageRequest.prototype, "error_message", void 0);
exports.ImageRequest = ImageRequest = __decorate([
    (0, mongoose_1.Schema)({ collection: 'image_requests', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
], ImageRequest);
exports.ImageRequestSchema = mongoose_1.SchemaFactory.createForClass(ImageRequest);
exports.ImageRequestSchema.index({ ai_status: 1, created_at: 1 });
//# sourceMappingURL=image-request.schema.js.map