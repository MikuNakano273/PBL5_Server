import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from 'src/database/schemas/device.schema';
import { Alert, AlertSchema } from 'src/database/schemas/alert.schema';
import { AlertReceiver, AlertReceiverSchema } from 'src/database/schemas/alert-receiver.schema';
import { CareLink, CareLinkSchema } from 'src/database/schemas/care-link.schema';
import { NotificationToken, NotificationTokenSchema } from 'src/database/schemas/notification-token.schema';
import { UserLiveStatus, UserLiveStatusSchema } from 'src/database/schemas/user-live-status.schema';
import { DistanceTelemetry, DistanceTelemetrySchema } from 'src/database/schemas/distance-telemetry.schema';
import { GpsLog, GpsLogSchema } from 'src/database/schemas/gps-log.schema';
import { OfflineDeviceJob } from './offline-device.job';
import { CleanupTelemetryJob } from './cleanup-telemetry.job';
import { RecomputeDailyStatsJob } from './recompute-daily-stats.job';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { RealtimeModule } from 'src/modules/realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Device.name, schema: DeviceSchema },
      { name: Alert.name, schema: AlertSchema },
      { name: AlertReceiver.name, schema: AlertReceiverSchema },
      { name: CareLink.name, schema: CareLinkSchema },
      { name: NotificationToken.name, schema: NotificationTokenSchema },
      { name: UserLiveStatus.name, schema: UserLiveStatusSchema },
      { name: DistanceTelemetry.name, schema: DistanceTelemetrySchema },
      { name: GpsLog.name, schema: GpsLogSchema },
    ]),
    NotificationsModule,
    RealtimeModule,
  ],
  providers: [OfflineDeviceJob, CleanupTelemetryJob, RecomputeDailyStatsJob],
})
export class JobsModule {}
