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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const notification_token_schema_1 = require("../../database/schemas/notification-token.schema");
class RegisterTokenDto {
    token;
    platform;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTokenDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['android', 'ios', 'web']),
    __metadata("design:type", String)
], RegisterTokenDto.prototype, "platform", void 0);
let NotificationsController = class NotificationsController {
    tokenModel;
    constructor(tokenModel) {
        this.tokenModel = tokenModel;
    }
    async registerToken(user, dto) {
        await this.tokenModel.findOneAndUpdate({ token: dto.token }, { user_id: new mongoose_2.Types.ObjectId(user.userId), platform: dto.platform, is_active: true, last_used_at: new Date() }, { upsert: true });
        return { registered: true };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Post)('tokens'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, RegisterTokenDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "registerToken", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, swagger_1.ApiTags)('Notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/v1/notifications'),
    __param(0, (0, mongoose_1.InjectModel)(notification_token_schema_1.NotificationToken.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map