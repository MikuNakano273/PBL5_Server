"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const image_request_schema_1 = require("../../database/schemas/image-request.schema");
const image_requests_controller_1 = require("./image-requests.controller");
const image_requests_service_1 = require("./image-requests.service");
let ImageRequestsModule = class ImageRequestsModule {
};
exports.ImageRequestsModule = ImageRequestsModule;
exports.ImageRequestsModule = ImageRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: image_request_schema_1.ImageRequest.name, schema: image_request_schema_1.ImageRequestSchema }]),
            bullmq_1.BullModule.registerQueue({ name: 'vision-jobs' }),
        ],
        controllers: [image_requests_controller_1.ImageRequestsController],
        providers: [image_requests_service_1.ImageRequestsService],
        exports: [image_requests_service_1.ImageRequestsService],
    })
], ImageRequestsModule);
//# sourceMappingURL=image-requests.module.js.map