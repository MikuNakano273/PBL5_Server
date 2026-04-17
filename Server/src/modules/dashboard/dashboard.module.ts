import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Alert, AlertSchema } from 'src/database/schemas/alert.schema';
import { Device, DeviceSchema } from 'src/database/schemas/device.schema';
import { UserLiveStatus, UserLiveStatusSchema } from 'src/database/schemas/user-live-status.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Alert.name, schema: AlertSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: UserLiveStatus.name, schema: UserLiveStatusSchema },
    ]),
    RealtimeModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
