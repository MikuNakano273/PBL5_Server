import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from 'src/database/schemas/device.schema';
import { UserLiveStatus, UserLiveStatusSchema } from 'src/database/schemas/user-live-status.schema';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Device.name, schema: DeviceSchema },
      { name: UserLiveStatus.name, schema: UserLiveStatusSchema },
    ]),
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
