import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CareLink, CareLinkDocument } from 'src/database/schemas/care-link.schema';
import { UserRole } from '../enums/app.enums';

/**
 * Guard that ensures a guardian user has an active care_link to the blindUserId
 * in the route param before accessing their data.
 * Admin and blind_user themselves are always allowed.
 */
@Injectable()
export class CareLinkGuard implements CanActivate {
  constructor(
    @InjectModel(CareLink.name) private readonly careLinkModel: Model<CareLinkDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: { userId: string; role: string } = request.user;
    if (!user) throw new UnauthorizedException();

    const blindUserId: string | undefined =
      request.params?.blindUserId || request.params?.blind_user_id;

    // Admin always allowed
    if (user.role === UserRole.ADMIN) return true;

    // Blind user can only access their own data
    if (user.role === UserRole.BLIND_USER) {
      if (blindUserId && user.userId !== blindUserId) throw new ForbiddenException('Access denied');
      return true;
    }

    // Guardian must have active care link
    if (!blindUserId) return true;
    const link = await this.careLinkModel.findOne({
      blind_user_id: new Types.ObjectId(blindUserId),
      guardian_user_id: new Types.ObjectId(user.userId),
      status: 'active',
    });
    if (!link) throw new ForbiddenException('No active care link');
    return true;
  }
}
