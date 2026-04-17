import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Device, DeviceSchema } from './schemas/device.schema';
import { CareLink, CareLinkSchema } from './schemas/care-link.schema';
import { GpsLog, GpsLogSchema } from './schemas/gps-log.schema';
import { DistanceTelemetry, DistanceTelemetrySchema } from './schemas/distance-telemetry.schema';
import { ImageRequest, ImageRequestSchema } from './schemas/image-request.schema';
import { VisionResult, VisionResultSchema } from './schemas/vision-result.schema';
import { Alert, AlertSchema } from './schemas/alert.schema';
import { AlertReceiver, AlertReceiverSchema } from './schemas/alert-receiver.schema';
import { NotificationToken, NotificationTokenSchema } from './schemas/notification-token.schema';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { UserLiveStatus, UserLiveStatusSchema } from './schemas/user-live-status.schema';

export const DATABASE_SCHEMAS = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
  { name: Device.name, schema: DeviceSchema },
  { name: CareLink.name, schema: CareLinkSchema },
  { name: GpsLog.name, schema: GpsLogSchema },
  { name: DistanceTelemetry.name, schema: DistanceTelemetrySchema },
  { name: ImageRequest.name, schema: ImageRequestSchema },
  { name: VisionResult.name, schema: VisionResultSchema },
  { name: Alert.name, schema: AlertSchema },
  { name: AlertReceiver.name, schema: AlertReceiverSchema },
  { name: NotificationToken.name, schema: NotificationTokenSchema },
  { name: RefreshToken.name, schema: RefreshTokenSchema },
  { name: AuditLog.name, schema: AuditLogSchema },
  { name: UserLiveStatus.name, schema: UserLiveStatusSchema },
]);

@Module({
  imports: [DATABASE_SCHEMAS],
  exports: [DATABASE_SCHEMAS],
})
export class DatabaseModule {}
