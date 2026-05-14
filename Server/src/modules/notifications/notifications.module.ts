import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import {
  NotificationEvent,
  NotificationEventSchema,
} from "src/database/schemas/notification-event.schema";
import {
  InstallationNotification,
  InstallationNotificationSchema,
} from "src/database/schemas/installation-notification.schema";
import {
  MobileInstallation,
  MobileInstallationSchema,
} from "src/database/schemas/mobile-installation.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationEvent.name, schema: NotificationEventSchema },
      {
        name: InstallationNotification.name,
        schema: InstallationNotificationSchema,
      },
      { name: MobileInstallation.name, schema: MobileInstallationSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
