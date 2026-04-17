import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alert, AlertDocument } from 'src/database/schemas/alert.schema';
import { AlertRiskLevel, AlertType } from 'src/common/enums/app.enums';

@Injectable()
export class AlertsService {
  constructor(@InjectModel(Alert.name) private readonly alertModel: Model<AlertDocument>) {}

  async listByBlindUser(blindUserId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter = { blind_user_id: new Types.ObjectId(blindUserId) };
    const [items, total] = await Promise.all([
      this.alertModel.find(filter).sort({ triggered_at: -1 }).skip(skip).limit(limit).lean(),
      this.alertModel.countDocuments(filter),
    ]);
    return { items, page, limit, total };
  }

  async recentAlerts(blindUserId: string, limit = 10) {
    return this.alertModel
      .find({ blind_user_id: new Types.ObjectId(blindUserId) })
      .sort({ triggered_at: -1 })
      .limit(limit)
      .lean();
  }

  async todayStats(blindUserId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const blindObjectId = new Types.ObjectId(blindUserId);
    const [total, high, medium] = await Promise.all([
      this.alertModel.countDocuments({ blind_user_id: blindObjectId, triggered_at: { $gte: startOfDay } }),
      this.alertModel.countDocuments({ blind_user_id: blindObjectId, triggered_at: { $gte: startOfDay }, risk_level: AlertRiskLevel.HIGH }),
      this.alertModel.countDocuments({ blind_user_id: blindObjectId, triggered_at: { $gte: startOfDay }, risk_level: AlertRiskLevel.MEDIUM }),
    ]);
    return { total, high, medium, low: total - high - medium, date: startOfDay.toISOString() };
  }

  async createDangerAlert(input: {
    blind_user_id: string;
    device_id: string;
    image_request_id?: string;
    distance_cm?: number;
    lat?: number;
    lng?: number;
    title: string;
    message: string;
  }) {
    return this.alertModel.create({
      blind_user_id: new Types.ObjectId(input.blind_user_id),
      device_id: new Types.ObjectId(input.device_id),
      image_request_id: input.image_request_id ? new Types.ObjectId(input.image_request_id) : undefined,
      alert_type: AlertType.OBSTACLE_DANGER,
      risk_level: AlertRiskLevel.HIGH,
      status: 'open',
      title: input.title,
      message: input.message,
      distance_cm: input.distance_cm,
      lat: input.lat,
      lng: input.lng,
      triggered_at: new Date(),
    });
  }
}
