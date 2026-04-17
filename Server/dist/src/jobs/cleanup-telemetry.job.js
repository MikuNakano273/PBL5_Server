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
var CleanupTelemetryJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupTelemetryJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const distance_telemetry_schema_1 = require("../database/schemas/distance-telemetry.schema");
const gps_log_schema_1 = require("../database/schemas/gps-log.schema");
let CleanupTelemetryJob = CleanupTelemetryJob_1 = class CleanupTelemetryJob {
    telemetryModel;
    gpsModel;
    logger = new common_1.Logger(CleanupTelemetryJob_1.name);
    constructor(telemetryModel, gpsModel) {
        this.telemetryModel = telemetryModel;
        this.gpsModel = gpsModel;
    }
    async cleanupOldRecords() {
        const distanceDays = parseInt(process.env.TELEMETRY_RETENTION_DAYS || '7', 10);
        const gpsDays = parseInt(process.env.GPS_RETENTION_DAYS || '30', 10);
        const distanceCutoff = new Date(Date.now() - distanceDays * 86400_000);
        const gpsCutoff = new Date(Date.now() - gpsDays * 86400_000);
        const [dr, gr] = await Promise.all([
            this.telemetryModel.deleteMany({ recorded_at: { $lt: distanceCutoff } }),
            this.gpsModel.deleteMany({ recorded_at: { $lt: gpsCutoff } }),
        ]);
        this.logger.log(`Cleanup: removed ${dr.deletedCount} telemetry, ${gr.deletedCount} GPS records`);
    }
};
exports.CleanupTelemetryJob = CleanupTelemetryJob;
__decorate([
    (0, schedule_1.Cron)('0 3 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CleanupTelemetryJob.prototype, "cleanupOldRecords", null);
exports.CleanupTelemetryJob = CleanupTelemetryJob = CleanupTelemetryJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(distance_telemetry_schema_1.DistanceTelemetry.name)),
    __param(1, (0, mongoose_1.InjectModel)(gps_log_schema_1.GpsLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], CleanupTelemetryJob);
//# sourceMappingURL=cleanup-telemetry.job.js.map