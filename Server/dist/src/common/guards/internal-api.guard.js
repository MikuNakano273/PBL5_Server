"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalApiGuard = void 0;
const common_1 = require("@nestjs/common");
let InternalApiGuard = class InternalApiGuard {
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const auth = req.headers['authorization'];
        const expected = `Bearer ${process.env.INTERNAL_WORKER_TOKEN || 'internal-secret'}`;
        if (!auth || auth !== expected)
            throw new common_1.UnauthorizedException('Internal token required');
        return true;
    }
};
exports.InternalApiGuard = InternalApiGuard;
exports.InternalApiGuard = InternalApiGuard = __decorate([
    (0, common_1.Injectable)()
], InternalApiGuard);
//# sourceMappingURL=internal-api.guard.js.map