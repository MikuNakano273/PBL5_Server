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
var RecomputeDailyStatsJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecomputeDailyStatsJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const alert_schema_1 = require("../database/schemas/alert.schema");
const user_live_status_schema_1 = require("../database/schemas/user-live-status.schema");
let RecomputeDailyStatsJob = RecomputeDailyStatsJob_1 = class RecomputeDailyStatsJob {
    alertModel;
    liveStatusModel;
    logger = new common_1.Logger(RecomputeDailyStatsJob_1.name);
    constructor(alertModel, liveStatusModel) {
        this.alertModel = alertModel;
        this.liveStatusModel = liveStatusModel;
    }
    async recompute() {
        const allUsers = await this.liveStatusModel.find().lean();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        for (const u of allUsers) {
            const count = await this.alertModel.countDocuments({
                blind_user_id: u.blind_user_id,
                triggered_at: { $gte: startOfDay },
            });
            this.logger.debug(`User ${u.blind_user_id}: ${count} alerts today`);
        }
        this.logger.log('Daily stats recomputed');
    }
};
exports.RecomputeDailyStatsJob = RecomputeDailyStatsJob;
__decorate([
    (0, schedule_1.Cron)('0 0 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecomputeDailyStatsJob.prototype, "recompute", null);
exports.RecomputeDailyStatsJob = RecomputeDailyStatsJob = RecomputeDailyStatsJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(alert_schema_1.Alert.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_live_status_schema_1.UserLiveStatus.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], RecomputeDailyStatsJob);
//# sourceMappingURL=recompute-daily-stats.job.js.map