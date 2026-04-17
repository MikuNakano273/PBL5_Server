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
exports.VisionResultSchema = exports.VisionResult = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const app_enums_1 = require("../../common/enums/app.enums");
let VisionResult = class VisionResult {
    image_request_id;
    model_name;
    model_version;
    objects;
    nearest_obstacle_cm;
    risk_level;
    summary_text;
    processed_at;
};
exports.VisionResult = VisionResult;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VisionResult.prototype, "image_request_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'yolov8' }),
    __metadata("design:type", String)
], VisionResult.prototype, "model_name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '1.0' }),
    __metadata("design:type", String)
], VisionResult.prototype, "model_version", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], VisionResult.prototype, "objects", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], VisionResult.prototype, "nearest_obstacle_cm", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: app_enums_1.AlertRiskLevel }),
    __metadata("design:type", String)
], VisionResult.prototype, "risk_level", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], VisionResult.prototype, "summary_text", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], VisionResult.prototype, "processed_at", void 0);
exports.VisionResult = VisionResult = __decorate([
    (0, mongoose_1.Schema)({ collection: 'vision_results', timestamps: { createdAt: 'created_at', updatedAt: false } })
], VisionResult);
exports.VisionResultSchema = mongoose_1.SchemaFactory.createForClass(VisionResult);
//# sourceMappingURL=vision-result.schema.js.map