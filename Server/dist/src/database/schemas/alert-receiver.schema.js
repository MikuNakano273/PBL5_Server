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
exports.AlertReceiverSchema = exports.AlertReceiver = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let AlertReceiver = class AlertReceiver {
    alert_id;
    user_id;
    is_push_sent;
    push_sent_at;
    viewed_at;
    acknowledged_at;
};
exports.AlertReceiver = AlertReceiver;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AlertReceiver.prototype, "alert_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AlertReceiver.prototype, "user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AlertReceiver.prototype, "is_push_sent", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], AlertReceiver.prototype, "push_sent_at", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], AlertReceiver.prototype, "viewed_at", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], AlertReceiver.prototype, "acknowledged_at", void 0);
exports.AlertReceiver = AlertReceiver = __decorate([
    (0, mongoose_1.Schema)({ collection: 'alert_receivers', timestamps: { createdAt: 'created_at', updatedAt: false } })
], AlertReceiver);
exports.AlertReceiverSchema = mongoose_1.SchemaFactory.createForClass(AlertReceiver);
exports.AlertReceiverSchema.index({ alert_id: 1, user_id: 1 }, { unique: true });
//# sourceMappingURL=alert-receiver.schema.js.map