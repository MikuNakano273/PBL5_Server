"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const realtime_gateway_1 = require("./realtime.gateway");
const live_status_service_1 = require("./live-status.service");
const user_live_status_schema_1 = require("../../database/schemas/user-live-status.schema");
let RealtimeModule = class RealtimeModule {
};
exports.RealtimeModule = RealtimeModule;
exports.RealtimeModule = RealtimeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: user_live_status_schema_1.UserLiveStatus.name, schema: user_live_status_schema_1.UserLiveStatusSchema }]),
        ],
        providers: [realtime_gateway_1.RealtimeGateway, live_status_service_1.LiveStatusService],
        exports: [realtime_gateway_1.RealtimeGateway, live_status_service_1.LiveStatusService],
    })
], RealtimeModule);
//# sourceMappingURL=realtime.module.js.map