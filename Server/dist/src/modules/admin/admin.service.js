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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../database/schemas/user.schema");
const device_schema_1 = require("../../database/schemas/device.schema");
const image_request_schema_1 = require("../../database/schemas/image-request.schema");
const alert_schema_1 = require("../../database/schemas/alert.schema");
let AdminService = class AdminService {
    userModel;
    deviceModel;
    imageRequestModel;
    alertModel;
    constructor(userModel, deviceModel, imageRequestModel, alertModel) {
        this.userModel = userModel;
        this.deviceModel = deviceModel;
        this.imageRequestModel = imageRequestModel;
        this.alertModel = alertModel;
    }
    async listUsers(page, limit) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.userModel.find().select('-password_hash').sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
            this.userModel.countDocuments(),
        ]);
        return { items, page, limit, total };
    }
    async listDevices(page, limit) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.deviceModel.find().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
            this.deviceModel.countDocuments(),
        ]);
        return { items, page, limit, total };
    }
    async listVisionRequests(page, limit) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.imageRequestModel.find().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
            this.imageRequestModel.countDocuments(),
        ]);
        return { items, page, limit, total };
    }
    async listAlerts(page, limit) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.alertModel.find().sort({ triggered_at: -1 }).skip(skip).limit(limit).lean(),
            this.alertModel.countDocuments(),
        ]);
        return { items, page, limit, total };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(device_schema_1.Device.name)),
    __param(2, (0, mongoose_1.InjectModel)(image_request_schema_1.ImageRequest.name)),
    __param(3, (0, mongoose_1.InjectModel)(alert_schema_1.Alert.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AdminService);
//# sourceMappingURL=admin.service.js.map