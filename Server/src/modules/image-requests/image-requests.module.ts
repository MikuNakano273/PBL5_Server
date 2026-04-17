import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ImageRequest, ImageRequestSchema } from 'src/database/schemas/image-request.schema';
import { ImageRequestsController } from './image-requests.controller';
import { ImageRequestsService } from './image-requests.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ImageRequest.name, schema: ImageRequestSchema }]),
    BullModule.registerQueue({ name: 'vision-jobs' }),
  ],
  controllers: [ImageRequestsController],
  providers: [ImageRequestsService],
  exports: [ImageRequestsService],
})
export class ImageRequestsModule {}
