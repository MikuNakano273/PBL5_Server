import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";

class UpdatePushTokenDto {
  @IsString()
  push_token!: string;

  @IsString()
  push_provider!: string; // 'fcm', 'apns'
}

class PaginationDto {
  @IsOptional()
  limit?: number;

  @IsOptional()
  skip?: number;
}

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("mobile/v1/installations/me/notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: { userId: string; installationId: string },
    @Query() query: PaginationDto,
  ) {
    const limit = query.limit || 20;
    const skip = query.skip || 0;

    const notifications =
      await this.notificationsService.getInstallationNotifications(
        user.installationId,
        limit,
        skip,
      );

    const unreadCount = await this.notificationsService.getUnreadCount(
      user.installationId,
    );

    return {
      notifications,
      unreadCount,
      limit,
      skip,
    };
  }

  @Post(":notificationId/read")
  async markAsRead(
    @CurrentUser() user: { userId: string; installationId: string },
    @Param("notificationId") notificationId: string,
  ) {
    await this.notificationsService.markAsRead(notificationId);
    return { success: true };
  }

  @Post("push-token")
  async updatePushToken(
    @CurrentUser() user: { userId: string; installationId: string },
    @Body() dto: UpdatePushTokenDto,
  ) {
    await this.notificationsService.updatePushToken(
      user.installationId,
      dto.push_token,
      dto.push_provider,
    );
    return { success: true };
  }
}
