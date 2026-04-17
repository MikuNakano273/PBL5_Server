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
exports.CareLinksService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const care_link_schema_1 = require("../../database/schemas/care-link.schema");
let CareLinksService = class CareLinksService {
    careLinkModel;
    constructor(careLinkModel) {
        this.careLinkModel = careLinkModel;
    }
    async getLinksForUser(userId, role) {
        if (role === 'guardian') {
            return this.careLinkModel
                .find({ guardian_user_id: new mongoose_2.Types.ObjectId(userId), status: 'active' })
                .lean();
        }
        return this.careLinkModel
            .find({ blind_user_id: new mongoose_2.Types.ObjectId(userId), status: 'active' })
            .lean();
    }
    async getGuardianIdsForBlindUser(blindUserId) {
        const links = await this.careLinkModel
            .find({ blind_user_id: new mongoose_2.Types.ObjectId(blindUserId), status: 'active', can_receive_alert: true })
            .lean();
        return links.map((l) => String(l.guardian_user_id));
    }
};
exports.CareLinksService = CareLinksService;
exports.CareLinksService = CareLinksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(care_link_schema_1.CareLink.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CareLinksService);
//# sourceMappingURL=care-links.service.js.map