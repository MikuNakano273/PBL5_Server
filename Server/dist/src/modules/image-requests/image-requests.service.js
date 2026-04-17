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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageRequestsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const mongoose_2 = require("mongoose");
const uuid_1 = require("uuid");
const image_request_schema_1 = require("../../database/schemas/image-request.schema");
const app_enums_1 = require("../../common/enums/app.enums");
let ImageRequestsService = class ImageRequestsService {
    imageRequestModel;
    visionQueue;
    constructor(imageRequestModel, visionQueue) {
        this.imageRequestModel = imageRequestModel;
        this.visionQueue = visionQueue;
    }
    async create(dto) {
        const request = await this.imageRequestModel.create({
            request_code: `REQ-${(0, uuid_1.v4)()}`,
            device_id: new mongoose_2.Types.ObjectId(dto.device_id),
            blind_user_id: new mongoose_2.Types.ObjectId(dto.blind_user_id),
            captured_at: new Date(dto.captured_at),
            distance_cm: dto.distance_cm,
            status: app_enums_1.ImageRequestStatus.CREATED,
            ai_status: 'pending',
        });
        return request;
    }
    async attachImage(requestId, objectKey) {
        const request = await this.imageRequestModel.findById(requestId);
        if (!request)
            throw new common_1.NotFoundException('Image request not found');
        request.image_path = objectKey;
        request.status = app_enums_1.ImageRequestStatus.QUEUED;
        request.ai_status = 'queued';
        await request.save();
        await this.visionQueue.add('process-image', { request_id: String(request._id), object_key: objectKey }, { attempts: 5, backoff: { type: 'exponential', delay: 3000 }, removeOnComplete: 1000, removeOnFail: 2000 });
        return { request_id: String(request._id), queued: true };
    }
};
exports.ImageRequestsService = ImageRequestsService;
exports.ImageRequestsService = ImageRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(image_request_schema_1.ImageRequest.name)),
    __param(1, (0, bullmq_1.InjectQueue)('vision-jobs')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        bullmq_2.Queue])
], ImageRequestsService);
//# sourceMappingURL=image-requests.service.js.map