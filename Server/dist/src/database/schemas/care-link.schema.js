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
exports.CareLinkSchema = exports.CareLink = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let CareLink = class CareLink {
    blind_user_id;
    guardian_user_id;
    relation;
    status;
    can_view_live_location;
    can_receive_alert;
};
exports.CareLink = CareLink;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], CareLink.prototype, "blind_user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], CareLink.prototype, "guardian_user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'family' }),
    __metadata("design:type", String)
], CareLink.prototype, "relation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'active', index: true }),
    __metadata("design:type", String)
], CareLink.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], CareLink.prototype, "can_view_live_location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], CareLink.prototype, "can_receive_alert", void 0);
exports.CareLink = CareLink = __decorate([
    (0, mongoose_1.Schema)({ collection: 'care_links', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
], CareLink);
exports.CareLinkSchema = mongoose_1.SchemaFactory.createForClass(CareLink);
exports.CareLinkSchema.index({ blind_user_id: 1, guardian_user_id: 1 }, { unique: true });
//# sourceMappingURL=care-link.schema.js.map