import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { Device, DeviceSchema } from 'src/database/schemas/device.schema';
import { ImageRequest, ImageRequestSchema } from 'src/database/schemas/image-request.schema';
import { Alert, AlertSchema } from 'src/database/schemas/alert.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: ImageRequest.name, schema: ImageRequestSchema },
      { name: Alert.name, schema: AlertSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
