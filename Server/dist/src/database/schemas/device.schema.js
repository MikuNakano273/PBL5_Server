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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceSchema = exports.Device = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const app_enums_1 = require("../../common/enums/app.enums");
let Device = class Device {
    serial_number;
    device_code;
    owner_blind_user_id;
    name;
    firmware_version;
    status;
    last_seen_at;
    last_battery;
    last_known_ip;
    device_secret_hash;
};
exports.Device = Device;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Device.prototype, "serial_number", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Device.prototype, "device_code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Device.prototype, "owner_blind_user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Device.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Device.prototype, "firmware_version", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: app_enums_1.DeviceStatus, default: app_enums_1.DeviceStatus.ACTIVE, index: true }),
    __metadata("design:type", String)
], Device.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Device.prototype, "last_seen_at", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Device.prototype, "last_battery", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Device.prototype, "last_known_ip", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Device.prototype, "device_secret_hash", void 0);
exports.Device = Device = __decorate([
    (0, mongoose_1.Schema)({ collection: 'devices', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
], Device);
exports.DeviceSchema = mongoose_1.SchemaFactory.createForClass(Device);
//# sourceMappingURL=device.schema.js.map