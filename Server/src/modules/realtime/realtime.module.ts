import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RealtimeGateway } from './realtime.gateway';
import { LiveStatusService } from './live-status.service';
import { UserLiveStatus, UserLiveStatusSchema } from 'src/database/schemas/user-live-status.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserLiveStatus.name, schema: UserLiveStatusSchema }]),
  ],
  providers: [RealtimeGateway, LiveStatusService],
  exports: [RealtimeGateway, LiveStatusService],
})
export class RealtimeModule {}
