"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const health_module_1 = require("./modules/health/health.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const care_links_module_1 = require("./modules/care-links/care-links.module");
const devices_module_1 = require("./modules/devices/devices.module");
const gps_module_1 = require("./modules/gps/gps.module");
const telemetry_module_1 = require("./modules/telemetry/telemetry.module");
const image_requests_module_1 = require("./modules/image-requests/image-requests.module");
const alerts_module_1 = require("./modules/alerts/alerts.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const realtime_module_1 = require("./modules/realtime/realtime.module");
const storage_module_1 = require("./modules/storage/storage.module");
const internal_module_1 = require("./modules/internal/internal.module");
const admin_module_1 = require("./modules/admin/admin.module");
const database_module_1 = require("./database/database.module");
const jobs_module_1 = require("./jobs/jobs.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
            mongoose_1.MongooseModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({ uri: config.get('MONGODB_URI') }),
            }),
            bullmq_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    connection: {
                        host: config.get('REDIS_HOST'),
                        port: Number(config.get('REDIS_PORT') || 6379),
                        password: config.get('REDIS_PASSWORD') || undefined,
                        db: Number(config.get('REDIS_DB') || 0),
                    },
                }),
            }),
            database_module_1.DatabaseModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            care_links_module_1.CareLinksModule,
            devices_module_1.DevicesModule,
            gps_module_1.GpsModule,
            telemetry_module_1.TelemetryModule,
            image_requests_module_1.ImageRequestsModule,
            alerts_module_1.AlertsModule,
            dashboard_module_1.DashboardModule,
            notifications_module_1.NotificationsModule,
            realtime_module_1.RealtimeModule,
            storage_module_1.StorageModule,
            internal_module_1.InternalModule,
            admin_module_1.AdminModule,
            jobs_module_1.JobsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map