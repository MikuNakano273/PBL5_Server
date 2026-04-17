"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const internal_controller_1 = require("./internal.controller");
const internal_service_1 = require("./internal.service");
const image_request_schema_1 = require("../../database/schemas/image-request.schema");
const vision_result_schema_1 = require("../../database/schemas/vision-result.schema");
const alert_schema_1 = require("../../database/schemas/alert.schema");
const alert_receiver_schema_1 = require("../../database/schemas/alert-receiver.schema");
const care_link_schema_1 = require("../../database/schemas/care-link.schema");
const notification_token_schema_1 = require("../../database/schemas/notification-token.schema");
const user_live_status_schema_1 = require("../../database/schemas/user-live-status.schema");
const notifications_module_1 = require("../notifications/notifications.module");
const realtime_module_1 = require("../realtime/realtime.module");
let InternalModule = class InternalModule {
};
exports.InternalModule = InternalModule;
exports.InternalModule = InternalModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: image_request_schema_1.ImageRequest.name, schema: image_request_schema_1.ImageRequestSchema },
                { name: vision_result_schema_1.VisionResult.name, schema: vision_result_schema_1.VisionResultSchema },
                { name: alert_schema_1.Alert.name, schema: alert_schema_1.AlertSchema },
                { name: alert_receiver_schema_1.AlertReceiver.name, schema: alert_receiver_schema_1.AlertReceiverSchema },
                { name: care_link_schema_1.CareLink.name, schema: care_link_schema_1.CareLinkSchema },
                { name: notification_token_schema_1.NotificationToken.name, schema: notification_token_schema_1.NotificationTokenSchema },
                { name: user_live_status_schema_1.UserLiveStatus.name, schema: user_live_status_schema_1.UserLiveStatusSchema },
            ]),
            bullmq_1.BullModule.registerQueue({ name: 'vision-jobs' }),
            notifications_module_1.NotificationsModule,
            realtime_module_1.RealtimeModule,
        ],
        controllers: [internal_controller_1.InternalController],
        providers: [internal_service_1.InternalService],
    })
], InternalModule);
//# sourceMappingURL=internal.module.js.map