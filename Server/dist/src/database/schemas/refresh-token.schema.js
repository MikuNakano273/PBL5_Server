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
exports.RefreshTokenSchema = exports.RefreshToken = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let RefreshToken = class RefreshToken {
    user_id;
    token_hash;
    expires_at;
    revoked_at;
    device_info;
};
exports.RefreshToken = RefreshToken;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], RefreshToken.prototype, "user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], RefreshToken.prototype, "token_hash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], RefreshToken.prototype, "expires_at", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], RefreshToken.prototype, "revoked_at", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], RefreshToken.prototype, "device_info", void 0);
exports.RefreshToken = RefreshToken = __decorate([
    (0, mongoose_1.Schema)({ collection: 'refresh_tokens', timestamps: { createdAt: 'created_at', updatedAt: false } })
], RefreshToken);
exports.RefreshTokenSchema = mongoose_1.SchemaFactory.createForClass(RefreshToken);
exports.RefreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
//# sourceMappingURL=refresh-token.schema.js.map