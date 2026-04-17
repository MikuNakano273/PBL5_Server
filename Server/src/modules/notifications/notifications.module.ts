import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationToken, NotificationTokenSchema } from 'src/database/schemas/notification-token.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: NotificationToken.name, schema: NotificationTokenSchema }])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
