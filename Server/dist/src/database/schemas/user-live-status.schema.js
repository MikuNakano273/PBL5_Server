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
exports.UserLiveStatusSchema = exports.UserLiveStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let UserLiveStatus = class UserLiveStatus {
    blind_user_id;
    device_id;
    current_safety_status;
    nearest_distance_cm;
    last_location;
    last_alert_at;
    last_seen_at;
};
exports.UserLiveStatus = UserLiveStatus;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, unique: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], UserLiveStatus.prototype, "blind_user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], UserLiveStatus.prototype, "device_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'safe', index: true }),
    __metadata("design:type", String)
], UserLiveStatus.prototype, "current_safety_status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], UserLiveStatus.prototype, "nearest_distance_cm", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], UserLiveStatus.prototype, "last_location", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], UserLiveStatus.prototype, "last_alert_at", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], UserLiveStatus.prototype, "last_seen_at", void 0);
exports.UserLiveStatus = UserLiveStatus = __decorate([
    (0, mongoose_1.Schema)({ collection: 'user_live_status', timestamps: { createdAt: false, updatedAt: 'updated_at' } })
], UserLiveStatus);
exports.UserLiveStatusSchema = mongoose_1.SchemaFactory.createForClass(UserLiveStatus);
//# sourceMappingURL=user-live-status.schema.js.map