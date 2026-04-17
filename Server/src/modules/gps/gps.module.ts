import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GpsLog, GpsLogSchema } from 'src/database/schemas/gps-log.schema';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: GpsLog.name, schema: GpsLogSchema }]),
    RealtimeModule,
  ],
  controllers: [GpsController],
  providers: [GpsService],
  exports: [GpsService],
})
export class GpsModule {}
