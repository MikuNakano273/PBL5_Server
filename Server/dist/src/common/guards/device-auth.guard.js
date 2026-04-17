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
exports.DeviceAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const device_schema_1 = require("../../database/schemas/device.schema");
const TIMESTAMP_TOLERANCE_MS = 30_000;
let DeviceAuthGuard = class DeviceAuthGuard {
    deviceModel;
    constructor(deviceModel) {
        this.deviceModel = deviceModel;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const deviceCode = req.headers['x-device-code'];
        const timestamp = req.headers['x-timestamp'];
        const signature = req.headers['x-signature'];
        if (!deviceCode || !timestamp || !signature) {
            throw new common_1.UnauthorizedException('Missing device auth headers');
        }
        const ts = Number(timestamp);
        if (isNaN(ts) || Math.abs(Date.now() - ts) > TIMESTAMP_TOLERANCE_MS) {
            throw new common_1.UnauthorizedException('Timestamp out of range');
        }
        const device = await this.deviceModel
            .findOne({ device_code: deviceCode, status: { $ne: 'disabled' } })
            .lean();
        if (!device || !device.device_secret_hash) {
            throw new common_1.UnauthorizedException('Unknown device');
        }
        const rawBody = req.rawBody || JSON.stringify(req.body) || '';
        const message = [req.method, req.originalUrl, rawBody, timestamp].join('\n');
        const expected = (0, crypto_1.createHmac)('sha256', device.device_secret_hash)
            .update(message)
            .digest('hex');
        if (expected !== signature)
            throw new common_1.UnauthorizedException('Invalid signature');
        req.device = device;
        return true;
    }
};
exports.DeviceAuthGuard = DeviceAuthGuard;
exports.DeviceAuthGuard = DeviceAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(device_schema_1.Device.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], DeviceAuthGuard);
//# sourceMappingURL=device-auth.guard.js.map