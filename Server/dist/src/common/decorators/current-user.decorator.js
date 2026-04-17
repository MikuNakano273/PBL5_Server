"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentDevice = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => ctx.switchToHttp().getRequest().user);
exports.CurrentDevice = (0, common_1.createParamDecorator)((_data, ctx) => ctx.switchToHttp().getRequest().device);
//# sourceMappingURL=current-user.decorator.js.map