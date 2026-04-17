"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = exports.DATABASE_SCHEMAS = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("./schemas/user.schema");
const device_schema_1 = require("./schemas/device.schema");
const care_link_schema_1 = require("./schemas/care-link.schema");
const gps_log_schema_1 = require("./schemas/gps-log.schema");
const distance_telemetry_schema_1 = require("./schemas/distance-telemetry.schema");
const image_request_schema_1 = require("./schemas/image-request.schema");
const vision_result_schema_1 = require("./schemas/vision-result.schema");
const alert_schema_1 = require("./schemas/alert.schema");
const alert_receiver_schema_1 = require("./schemas/alert-receiver.schema");
const notification_token_schema_1 = require("./schemas/notification-token.schema");
const refresh_token_schema_1 = require("./schemas/refresh-token.schema");
const audit_log_schema_1 = require("./schemas/audit-log.schema");
const user_live_status_schema_1 = require("./schemas/user-live-status.schema");
exports.DATABASE_SCHEMAS = mongoose_1.MongooseModule.forFeature([
    { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
    { name: device_schema_1.Device.name, schema: device_schema_1.DeviceSchema },
    { name: care_link_schema_1.CareLink.name, schema: care_link_schema_1.CareLinkSchema },
    { name: gps_log_schema_1.GpsLog.name, schema: gps_log_schema_1.GpsLogSchema },
    { name: distance_telemetry_schema_1.DistanceTelemetry.name, schema: distance_telemetry_schema_1.DistanceTelemetrySchema },
    { name: image_request_schema_1.ImageRequest.name, schema: image_request_schema_1.ImageRequestSchema },
    { name: vision_result_schema_1.VisionResult.name, schema: vision_result_schema_1.VisionResultSchema },
    { name: alert_schema_1.Alert.name, schema: alert_schema_1.AlertSchema },
    { name: alert_receiver_schema_1.AlertReceiver.name, schema: alert_receiver_schema_1.AlertReceiverSchema },
    { name: notification_token_schema_1.NotificationToken.name, schema: notification_token_schema_1.NotificationTokenSchema },
    { name: refresh_token_schema_1.RefreshToken.name, schema: refresh_token_schema_1.RefreshTokenSchema },
    { name: audit_log_schema_1.AuditLog.name, schema: audit_log_schema_1.AuditLogSchema },
    { name: user_live_status_schema_1.UserLiveStatus.name, schema: user_live_status_schema_1.UserLiveStatusSchema },
]);
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [exports.DATABASE_SCHEMAS],
        exports: [exports.DATABASE_SCHEMAS],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map