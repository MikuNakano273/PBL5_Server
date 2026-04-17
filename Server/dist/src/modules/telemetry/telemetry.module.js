"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const distance_telemetry_schema_1 = require("../../database/schemas/distance-telemetry.schema");
const alert_schema_1 = require("../../database/schemas/alert.schema");
const alert_receiver_schema_1 = require("../../database/schemas/alert-receiver.schema");
const care_link_schema_1 = require("../../database/schemas/care-link.schema");
const notification_token_schema_1 = require("../../database/schemas/notification-token.schema");
const telemetry_controller_1 = require("./telemetry.controller");
const telemetry_service_1 = require("./telemetry.service");
const realtime_module_1 = require("../realtime/realtime.module");
const notifications_module_1 = require("../notifications/notifications.module");
let TelemetryModule = class TelemetryModule {
};
exports.TelemetryModule = TelemetryModule;
exports.TelemetryModule = TelemetryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: distance_telemetry_schema_1.DistanceTelemetry.name, schema: distance_telemetry_schema_1.DistanceTelemetrySchema },
                { name: alert_schema_1.Alert.name, schema: alert_schema_1.AlertSchema },
                { name: alert_receiver_schema_1.AlertReceiver.name, schema: alert_receiver_schema_1.AlertReceiverSchema },
                { name: care_link_schema_1.CareLink.name, schema: care_link_schema_1.CareLinkSchema },
                { name: notification_token_schema_1.NotificationToken.name, schema: notification_token_schema_1.NotificationTokenSchema },
            ]),
            realtime_module_1.RealtimeModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [telemetry_controller_1.TelemetryController],
        providers: [telemetry_service_1.TelemetryService],
        exports: [telemetry_service_1.TelemetryService],
    })
], TelemetryModule);
//# sourceMappingURL=telemetry.module.js.map