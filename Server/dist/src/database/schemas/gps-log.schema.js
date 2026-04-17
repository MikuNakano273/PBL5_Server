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
exports.GpsLogSchema = exports.GpsLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let GpsLog = class GpsLog {
    device_id;
    blind_user_id;
    lat;
    lng;
    location;
    accuracy;
    speed;
    heading;
    recorded_at;
};
exports.GpsLog = GpsLog;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], GpsLog.prototype, "device_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], GpsLog.prototype, "blind_user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], GpsLog.prototype, "lat", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], GpsLog.prototype, "lng", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, index: '2dsphere' }),
    __metadata("design:type", Object)
], GpsLog.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], GpsLog.prototype, "accuracy", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], GpsLog.prototype, "speed", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], GpsLog.prototype, "heading", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", Date)
], GpsLog.prototype, "recorded_at", void 0);
exports.GpsLog = GpsLog = __decorate([
    (0, mongoose_1.Schema)({ collection: 'gps_logs', timestamps: { createdAt: 'created_at', updatedAt: false } })
], GpsLog);
exports.GpsLogSchema = mongoose_1.SchemaFactory.createForClass(GpsLog);
exports.GpsLogSchema.index({ blind_user_id: 1, recorded_at: -1 });
//# sourceMappingURL=gps-log.schema.js.map