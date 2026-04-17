import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationToken, NotificationTokenDocument } from 'src/database/schemas/notification-token.schema';

class RegisterTokenDto {
  @IsString()
  token!: string;
  @IsIn(['android', 'ios', 'web'])
  platform!: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/v1/notifications')
export class NotificationsController {
  constructor(
    @InjectModel(NotificationToken.name) private readonly tokenModel: Model<NotificationTokenDocument>,
  ) {}

  @Post('tokens')
  async registerToken(
    @CurrentUser() user: { userId: string },
    @Body() dto: RegisterTokenDto,
  ) {
    await this.tokenModel.findOneAndUpdate(
      { token: dto.token },
      { user_id: new Types.ObjectId(user.userId), platform: dto.platform, is_active: true, last_used_at: new Date() },
      { upsert: true },
    );
    return { registered: true };
  }
}
