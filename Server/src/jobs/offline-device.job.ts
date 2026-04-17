import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Device, DeviceDocument } from 'src/database/schemas/device.schema';
import { Alert, AlertDocument } from 'src/database/schemas/alert.schema';
import { AlertReceiver, AlertReceiverDocument } from 'src/database/schemas/alert-receiver.schema';
import { CareLink, CareLinkDocument } from 'src/database/schemas/care-link.schema';
import { NotificationToken, NotificationTokenDocument } from 'src/database/schemas/notification-token.schema';
import { UserLiveStatus, UserLiveStatusDocument } from 'src/database/schemas/user-live-status.schema';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { RealtimeGateway } from 'src/modules/realtime/realtime.gateway';
import { AlertType, AlertRiskLevel } from 'src/common/enums/app.enums';

@Injectable()
export class OfflineDeviceJob {
  private readonly logger = new Logger(OfflineDeviceJob.name);
  private readonly OFFLINE_SECS = parseInt(process.env.DEVICE_OFFLINE_THRESHOLD_SECONDS || '60', 10);

  constructor(
    @InjectModel(Device.name) private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(Alert.name) private readonly alertModel: Model<AlertDocument>,
    @InjectModel(AlertReceiver.name) private readonly alertReceiverModel: Model<AlertReceiverDocument>,
    @InjectModel(CareLink.name) private readonly careLinkModel: Model<CareLinkDocument>,
    @InjectModel(NotificationToken.name) private readonly tokenModel: Model<NotificationTokenDocument>,
    @InjectModel(UserLiveStatus.name) private readonly liveStatusModel: Model<UserLiveStatusDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkOfflineDevices() {
    const threshold = new Date(Date.now() - this.OFFLINE_SECS * 1000);
    const offlineDevices = await this.deviceModel.find({
      status: 'active',
      last_seen_at: { $lt: threshold },
    }).lean();

    for (const device of offlineDevices) {
      const blindUserId = String(device.owner_blind_user_id);
      this.logger.warn(`Device ${device.device_code} offline`);

      // Update device status
      await this.deviceModel.findByIdAndUpdate(device._id, { status: 'offline' });
      await this.liveStatusModel.findOneAndUpdate(
        { blind_user_id: device.owner_blind_user_id },
        { current_safety_status: 'offline', updated_at: new Date() },
        { upsert: true },
      );

      // Dedup: don't spam offline alerts
      const recentOffline = await this.alertModel.findOne({
        device_id: device._id,
        alert_type: AlertType.DEVICE_OFFLINE,
        triggered_at: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      }).lean();
      if (recentOffline) continue;

      const alert = await this.alertModel.create({
        blind_user_id: device.owner_blind_user_id,
        device_id: device._id,
        alert_type: AlertType.DEVICE_OFFLINE,
        risk_level: AlertRiskLevel.MEDIUM,
        status: 'open',
        title: 'Thiet bi mat ket noi',
        message: `Gay ${device.device_code} khong gui tin hieu trong ${this.OFFLINE_SECS}s`,
        triggered_at: new Date(),
      });

      const guardianLinks = await this.careLinkModel
        .find({ blind_user_id: device.owner_blind_user_id, status: 'active', can_receive_alert: true })
        .lean();
      const guardianIds = guardianLinks.map((l) => l.guardian_user_id);
      if (guardianIds.length > 0) {
        await this.alertReceiverModel.insertMany(
          guardianIds.map((uid) => ({ alert_id: alert._id, user_id: uid })),
        );
        const tokens = await this.tokenModel.find({ user_id: { $in: guardianIds }, is_active: true }).lean();
        const fcmTokens = tokens.map((t) => t.token);
        if (fcmTokens.length > 0) {
          await this.notificationsService.sendPush(fcmTokens, {
            title: 'Thiet bi mat ket noi',
            body: `Gay ${device.device_code} offline`,
            alert_id: String(alert._id),
          });
        }
      }
      this.realtimeGateway.emitToBlindUser(blindUserId, 'alert:created', {
        alert_id: String(alert._id),
        alert_type: AlertType.DEVICE_OFFLINE,
      });
    }
  }
}
