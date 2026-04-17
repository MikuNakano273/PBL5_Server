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
exports.AuditLogSchema = exports.AuditLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let AuditLog = class AuditLog {
    actor_type;
    actor_id;
    action;
    resource_type;
    resource_id;
    metadata;
};
exports.AuditLog = AuditLog;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "actor_type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "actor_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, mongoose_1.Prop)({ index: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "resource_type", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AuditLog.prototype, "resource_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], AuditLog.prototype, "metadata", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, mongoose_1.Schema)({ collection: 'audit_logs', timestamps: { createdAt: 'created_at', updatedAt: false } })
], AuditLog);
exports.AuditLogSchema = mongoose_1.SchemaFactory.createForClass(AuditLog);
//# sourceMappingURL=audit-log.schema.js.map