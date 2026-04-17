import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DistanceTelemetry, DistanceTelemetrySchema } from 'src/database/schemas/distance-telemetry.schema';
import { Alert, AlertSchema } from 'src/database/schemas/alert.schema';
import { AlertReceiver, AlertReceiverSchema } from 'src/database/schemas/alert-receiver.schema';
import { CareLink, CareLinkSchema } from 'src/database/schemas/care-link.schema';
import { NotificationToken, NotificationTokenSchema } from 'src/database/schemas/notification-token.schema';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DistanceTelemetry.name, schema: DistanceTelemetrySchema },
      { name: Alert.name, schema: AlertSchema },
      { name: AlertReceiver.name, schema: AlertReceiverSchema },
      { name: CareLink.name, schema: CareLinkSchema },
      { name: NotificationToken.name, schema: NotificationTokenSchema },
    ]),
    RealtimeModule,
    NotificationsModule,
  ],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
