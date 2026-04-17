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
exports.CareLinkGuard = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const care_link_schema_1 = require("../../database/schemas/care-link.schema");
const app_enums_1 = require("../enums/app.enums");
let CareLinkGuard = class CareLinkGuard {
    careLinkModel;
    constructor(careLinkModel) {
        this.careLinkModel = careLinkModel;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            throw new common_1.UnauthorizedException();
        const blindUserId = request.params?.blindUserId || request.params?.blind_user_id;
        if (user.role === app_enums_1.UserRole.ADMIN)
            return true;
        if (user.role === app_enums_1.UserRole.BLIND_USER) {
            if (blindUserId && user.userId !== blindUserId)
                throw new common_1.ForbiddenException('Access denied');
            return true;
        }
        if (!blindUserId)
            return true;
        const link = await this.careLinkModel.findOne({
            blind_user_id: new mongoose_2.Types.ObjectId(blindUserId),
            guardian_user_id: new mongoose_2.Types.ObjectId(user.userId),
            status: 'active',
        });
        if (!link)
            throw new common_1.ForbiddenException('No active care link');
        return true;
    }
};
exports.CareLinkGuard = CareLinkGuard;
exports.CareLinkGuard = CareLinkGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(care_link_schema_1.CareLink.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CareLinkGuard);
//# sourceMappingURL=care-link.guard.js.map