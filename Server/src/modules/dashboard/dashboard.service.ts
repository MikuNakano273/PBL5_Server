import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alert, AlertDocument } from 'src/database/schemas/alert.schema';
import { Device, DeviceDocument } from 'src/database/schemas/device.schema';
import { UserLiveStatus, UserLiveStatusDocument } from 'src/database/schemas/user-live-status.schema';
import { LiveStatusService } from '../realtime/live-status.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Alert.name) private readonly alertModel: Model<AlertDocument>,
    @InjectModel(Device.name) private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(UserLiveStatus.name) private readonly liveStatusModel: Model<UserLiveStatusDocument>,
    private readonly liveStatusService: LiveStatusService,
  ) {}

  async getDashboard(blindUserId: string) {
    const blindObjectId = new Types.ObjectId(blindUserId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayAlerts, recentAlerts, liveStatus, redisStatus] = await Promise.all([
      this.alertModel.countDocuments({ blind_user_id: blindObjectId, triggered_at: { $gte: startOfDay } }),
      this.alertModel.find({ blind_user_id: blindObjectId }).sort({ triggered_at: -1 }).limit(5).lean(),
      this.liveStatusModel.findOne({ blind_user_id: blindObjectId }).lean(),
      this.liveStatusService.getDashboardStatus(blindUserId),
    ]);

    let device = null;
    if (liveStatus?.device_id) {
      device = await this.deviceModel.findById(liveStatus.device_id).select('serial_number status last_seen_at last_battery').lean();
    }

    const safetyStatus = redisStatus.current_safety_status || liveStatus?.current_safety_status || 'unknown';

    return {
      blind_user_id: blindUserId,
      is_safe: safetyStatus === 'safe',
      current_safety_status: safetyStatus,
      nearest_distance_cm: redisStatus.nearest_distance_cm ?? liveStatus?.nearest_distance_cm ?? null,
      last_location: redisStatus.last_location ?? liveStatus?.last_location ?? null,
      today_alert_count: todayAlerts,
      recent_alerts: recentAlerts,
      device_last_seen_at: device?.last_seen_at ?? liveStatus?.last_seen_at ?? null,
      device_battery: device?.last_battery ?? null,
      last_updated_at: new Date().toISOString(),
    };
  }
}
