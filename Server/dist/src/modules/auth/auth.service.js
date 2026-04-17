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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const mongoose_2 = require("mongoose");
const argon2 = require("argon2");
const crypto = require("crypto");
const user_schema_1 = require("../../database/schemas/user.schema");
const refresh_token_schema_1 = require("../../database/schemas/refresh-token.schema");
let AuthService = class AuthService {
    userModel;
    refreshTokenModel;
    jwtService;
    constructor(userModel, refreshTokenModel, jwtService) {
        this.userModel = userModel;
        this.refreshTokenModel = refreshTokenModel;
        this.jwtService = jwtService;
    }
    async login(email, password, deviceInfo) {
        const user = await this.userModel.findOne({ email, status: 'active' }).lean();
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const ok = await argon2.verify(user.password_hash, password);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const sub = String(user._id);
        const accessToken = await this.jwtService.signAsync({ sub, role: user.role }, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' });
        const rawRefresh = await this.generateRefreshToken();
        const expiresInDays = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '30', 10);
        const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
        const tokenHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
        await this.refreshTokenModel.create({
            user_id: new mongoose_2.Types.ObjectId(sub),
            token_hash: tokenHash,
            expires_at: expiresAt,
            device_info: deviceInfo,
        });
        await this.userModel.findByIdAndUpdate(user._id, { last_login_at: new Date() });
        return {
            access_token: accessToken,
            refresh_token: rawRefresh,
            user: { id: sub, email: user.email, role: user.role, full_name: user.full_name },
        };
    }
    async refresh(rawRefreshToken) {
        const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
        const stored = await this.refreshTokenModel
            .findOne({ token_hash: tokenHash, revoked_at: null, expires_at: { $gt: new Date() } })
            .lean();
        if (!stored)
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        const user = await this.userModel.findById(stored.user_id).lean();
        if (!user || user.status !== 'active')
            throw new common_1.UnauthorizedException('User unavailable');
        const accessToken = await this.jwtService.signAsync({ sub: String(user._id), role: user.role }, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' });
        return { access_token: accessToken };
    }
    async revokeRefreshToken(rawRefreshToken) {
        const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
        await this.refreshTokenModel.updateOne({ token_hash: tokenHash }, { revoked_at: new Date() });
    }
    async hashPassword(plain) {
        return argon2.hash(plain);
    }
    generateRefreshToken() {
        return new Promise((resolve, reject) => crypto.randomBytes(48, (err, buf) => (err ? reject(err) : resolve(buf.toString('hex')))));
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(refresh_token_schema_1.RefreshToken.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map