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
exports.AlertsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const alerts_service_1 = require("./alerts.service");
let AlertsController = class AlertsController {
    alertsService;
    constructor(alertsService) {
        this.alertsService = alertsService;
    }
    list(blindUserId, page = '1', limit = '20') {
        return this.alertsService.listByBlindUser(blindUserId, Number(page), Number(limit));
    }
    recent(blindUserId) {
        return this.alertsService.recentAlerts(blindUserId, 10);
    }
    todayStats(blindUserId) {
        return this.alertsService.todayStats(blindUserId);
    }
};
exports.AlertsController = AlertsController;
__decorate([
    (0, common_1.Get)(':blindUserId'),
    __param(0, (0, common_1.Param)('blindUserId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':blindUserId/recent'),
    __param(0, (0, common_1.Param)('blindUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "recent", null);
__decorate([
    (0, common_1.Get)(':blindUserId/stats/today'),
    __param(0, (0, common_1.Param)('blindUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "todayStats", null);
exports.AlertsController = AlertsController = __decorate([
    (0, swagger_1.ApiTags)('Mobile Alerts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/v1/alerts'),
    __metadata("design:paramtypes", [alerts_service_1.AlertsService])
], AlertsController);
//# sourceMappingURL=alerts.controller.js.map