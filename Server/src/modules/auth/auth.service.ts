import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { User, UserDocument } from 'src/database/schemas/user.schema';
import { RefreshToken, RefreshTokenDocument } from 'src/database/schemas/refresh-token.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string, deviceInfo?: Record<string, string>) {
    const user = await this.userModel.findOne({ email, status: 'active' }).lean();
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.password_hash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const sub = String(user._id);
    const accessToken = await this.jwtService.signAsync(
      { sub, role: user.role },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
    );
    const rawRefresh = await this.generateRefreshToken();
    const expiresInDays = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '30', 10);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    const tokenHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
    await this.refreshTokenModel.create({
      user_id: new Types.ObjectId(sub),
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

  async refresh(rawRefreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const stored = await this.refreshTokenModel
      .findOne({ token_hash: tokenHash, revoked_at: null, expires_at: { $gt: new Date() } })
      .lean();
    if (!stored) throw new UnauthorizedException('Invalid or expired refresh token');
    const user = await this.userModel.findById(stored.user_id).lean();
    if (!user || user.status !== 'active') throw new UnauthorizedException('User unavailable');
    const accessToken = await this.jwtService.signAsync(
      { sub: String(user._id), role: user.role },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
    );
    return { access_token: accessToken };
  }

  async revokeRefreshToken(rawRefreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    await this.refreshTokenModel.updateOne({ token_hash: tokenHash }, { revoked_at: new Date() });
  }

  async hashPassword(plain: string) {
    return argon2.hash(plain);
  }

  private generateRefreshToken(): Promise<string> {
    return new Promise((resolve, reject) =>
      crypto.randomBytes(48, (err, buf) => (err ? reject(err) : resolve(buf.toString('hex')))),
    );
  }
}
