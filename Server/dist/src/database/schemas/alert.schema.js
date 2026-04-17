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
exports.AlertSchema = exports.Alert = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const app_enums_1 = require("../../common/enums/app.enums");
let Alert = class Alert {
    blind_user_id;
    device_id;
    image_request_id;
    alert_type;
    risk_level;
    status;
    title;
    message;
    lat;
    lng;
    distance_cm;
    triggered_at;
    resolved_at;
};
exports.Alert = Alert;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Alert.prototype, "blind_user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Alert.prototype, "device_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Alert.prototype, "image_request_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: app_enums_1.AlertType, required: true, index: true }),
    __metadata("design:type", String)
], Alert.prototype, "alert_type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: app_enums_1.AlertRiskLevel, required: true, index: true }),
    __metadata("design:type", String)
], Alert.prototype, "risk_level", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'open', index: true }),
    __metadata("design:type", String)
], Alert.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Alert.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Alert.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Alert.prototype, "lat", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Alert.prototype, "lng", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Alert.prototype, "distance_cm", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", Date)
], Alert.prototype, "triggered_at", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Alert.prototype, "resolved_at", void 0);
exports.Alert = Alert = __decorate([
    (0, mongoose_1.Schema)({ collection: 'alerts', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
], Alert);
exports.AlertSchema = mongoose_1.SchemaFactory.createForClass(Alert);
exports.AlertSchema.index({ blind_user_id: 1, triggered_at: -1 });
//# sourceMappingURL=alert.schema.js.map