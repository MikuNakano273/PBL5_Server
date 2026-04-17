"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const alert_schema_1 = require("../../database/schemas/alert.schema");
const device_schema_1 = require("../../database/schemas/device.schema");
const user_live_status_schema_1 = require("../../database/schemas/user-live-status.schema");
const dashboard_controller_1 = require("./dashboard.controller");
const dashboard_service_1 = require("./dashboard.service");
const realtime_module_1 = require("../realtime/realtime.module");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: alert_schema_1.Alert.name, schema: alert_schema_1.AlertSchema },
                { name: device_schema_1.Device.name, schema: device_schema_1.DeviceSchema },
                { name: user_live_status_schema_1.UserLiveStatus.name, schema: user_live_status_schema_1.UserLiveStatusSchema },
            ]),
            realtime_module_1.RealtimeModule,
        ],
        controllers: [dashboard_controller_1.DashboardController],
        providers: [dashboard_service_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map