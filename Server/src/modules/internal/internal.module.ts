import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';
import { ImageRequest, ImageRequestSchema } from 'src/database/schemas/image-request.schema';
import { VisionResult, VisionResultSchema } from 'src/database/schemas/vision-result.schema';
import { Alert, AlertSchema } from 'src/database/schemas/alert.schema';
import { AlertReceiver, AlertReceiverSchema } from 'src/database/schemas/alert-receiver.schema';
import { CareLink, CareLinkSchema } from 'src/database/schemas/care-link.schema';
import { NotificationToken, NotificationTokenSchema } from 'src/database/schemas/notification-token.schema';
import { UserLiveStatus, UserLiveStatusSchema } from 'src/database/schemas/user-live-status.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImageRequest.name, schema: ImageRequestSchema },
      { name: VisionResult.name, schema: VisionResultSchema },
      { name: Alert.name, schema: AlertSchema },
      { name: AlertReceiver.name, schema: AlertReceiverSchema },
      { name: CareLink.name, schema: CareLinkSchema },
      { name: NotificationToken.name, schema: NotificationTokenSchema },
      { name: UserLiveStatus.name, schema: UserLiveStatusSchema },
    ]),
    BullModule.registerQueue({ name: 'vision-jobs' }),
    NotificationsModule,
    RealtimeModule,
  ],
  controllers: [InternalController],
  providers: [InternalService],
})
export class InternalModule {}
