import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GpsLog, GpsLogDocument } from 'src/database/schemas/gps-log.schema';
import { LiveStatusService } from '../realtime/live-status.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class GpsService {
  constructor(
    @InjectModel(GpsLog.name) private readonly gpsModel: Model<GpsLogDocument>,
    private readonly liveStatus: LiveStatusService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async ingest(dto: {
    device_id: string;
    blind_user_id: string;
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    recorded_at: string;
  }) {
    const log = await this.gpsModel.create({
      device_id: new Types.ObjectId(dto.device_id),
      blind_user_id: new Types.ObjectId(dto.blind_user_id),
      lat: dto.lat,
      lng: dto.lng,
      location: { type: 'Point', coordinates: [dto.lng, dto.lat] },
      accuracy: dto.accuracy,
      speed: dto.speed,
      heading: dto.heading,
      recorded_at: new Date(dto.recorded_at),
    });

    await this.liveStatus.updateLocationStatus(dto.blind_user_id, dto.lat, dto.lng, dto.accuracy);
    await this.liveStatus.markDeviceLastSeen(dto.device_id);

    this.realtimeGateway.emitToBlindUser(dto.blind_user_id, 'location:updated', {
      lat: dto.lat,
      lng: dto.lng,
      accuracy: dto.accuracy,
    });

    return { ok: true, id: String(log._id) };
  }

  async getHistory(blindUserId: string, limit = 50) {
    return this.gpsModel
      .find({ blind_user_id: new Types.ObjectId(blindUserId) })
      .sort({ recorded_at: -1 })
      .limit(limit)
      .lean();
  }
}
