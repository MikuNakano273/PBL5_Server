"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const device_schema_1 = require("../database/schemas/device.schema");
const alert_schema_1 = require("../database/schemas/alert.schema");
const alert_receiver_schema_1 = require("../database/schemas/alert-receiver.schema");
const care_link_schema_1 = require("../database/schemas/care-link.schema");
const notification_token_schema_1 = require("../database/schemas/notification-token.schema");
const user_live_status_schema_1 = require("../database/schemas/user-live-status.schema");
const distance_telemetry_schema_1 = require("../database/schemas/distance-telemetry.schema");
const gps_log_schema_1 = require("../database/schemas/gps-log.schema");
const offline_device_job_1 = require("./offline-device.job");
const cleanup_telemetry_job_1 = require("./cleanup-telemetry.job");
const recompute_daily_stats_job_1 = require("./recompute-daily-stats.job");
const notifications_module_1 = require("../modules/notifications/notifications.module");
const realtime_module_1 = require("../modules/realtime/realtime.module");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: device_schema_1.Device.name, schema: device_schema_1.DeviceSchema },
                { name: alert_schema_1.Alert.name, schema: alert_schema_1.AlertSchema },
                { name: alert_receiver_schema_1.AlertReceiver.name, schema: alert_receiver_schema_1.AlertReceiverSchema },
                { name: care_link_schema_1.CareLink.name, schema: care_link_schema_1.CareLinkSchema },
                { name: notification_token_schema_1.NotificationToken.name, schema: notification_token_schema_1.NotificationTokenSchema },
                { name: user_live_status_schema_1.UserLiveStatus.name, schema: user_live_status_schema_1.UserLiveStatusSchema },
                { name: distance_telemetry_schema_1.DistanceTelemetry.name, schema: distance_telemetry_schema_1.DistanceTelemetrySchema },
                { name: gps_log_schema_1.GpsLog.name, schema: gps_log_schema_1.GpsLogSchema },
            ]),
            notifications_module_1.NotificationsModule,
            realtime_module_1.RealtimeModule,
        ],
        providers: [offline_device_job_1.OfflineDeviceJob, cleanup_telemetry_job_1.CleanupTelemetryJob, recompute_daily_stats_job_1.RecomputeDailyStatsJob],
    })
], JobsModule);
//# sourceMappingURL=jobs.module.js.map