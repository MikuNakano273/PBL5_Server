import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ImageRequest, ImageRequestDocument } from 'src/database/schemas/image-request.schema';
import { ImageRequestStatus } from 'src/common/enums/app.enums';

@Injectable()
export class ImageRequestsService {
  constructor(
    @InjectModel(ImageRequest.name) private readonly imageRequestModel: Model<ImageRequestDocument>,
    @InjectQueue('vision-jobs') private readonly visionQueue: Queue,
  ) {}

  async create(dto: { device_id: string; blind_user_id: string; captured_at: string; distance_cm?: number }) {
    const request = await this.imageRequestModel.create({
      request_code: `REQ-${uuidv4()}`,
      device_id: new Types.ObjectId(dto.device_id),
      blind_user_id: new Types.ObjectId(dto.blind_user_id),
      captured_at: new Date(dto.captured_at),
      distance_cm: dto.distance_cm,
      status: ImageRequestStatus.CREATED,
      ai_status: 'pending',
    });
    return request;
  }

  async attachImage(requestId: string, objectKey: string) {
    const request = await this.imageRequestModel.findById(requestId);
    if (!request) throw new NotFoundException('Image request not found');

    request.image_path = objectKey;
    request.status = ImageRequestStatus.QUEUED;
    request.ai_status = 'queued';
    await request.save();

    await this.visionQueue.add(
      'process-image',
      { request_id: String(request._id), object_key: objectKey },
      { attempts: 5, backoff: { type: 'exponential', delay: 3000 }, removeOnComplete: 1000, removeOnFail: 2000 },
    );

    return { request_id: String(request._id), queued: true };
  }
}
