import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DistanceTelemetry, DistanceTelemetryDocument } from 'src/database/schemas/distance-telemetry.schema';
import { Alert, AlertDocument } from 'src/database/schemas/alert.schema';
import { AlertReceiver, AlertReceiverDocument } from 'src/database/schemas/alert-receiver.schema';
import { CareLink, CareLinkDocument } from 'src/database/schemas/care-link.schema';
import { NotificationToken, NotificationTokenDocument } from 'src/database/schemas/notification-token.schema';
import { LiveStatusService } from '../realtime/live-status.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { AlertType, AlertRiskLevel } from 'src/common/enums/app.enums';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly DANGER_CM = parseInt(process.env.ALERT_DISTANCE_DANGER_CM || '100', 10);

  constructor(
    @InjectModel(DistanceTelemetry.name) private readonly telemetryModel: Model<DistanceTelemetryDocument>,
    @InjectModel(Alert.name) private readonly alertModel: Model<AlertDocument>,
    @InjectModel(AlertReceiver.name) private readonly alertReceiverModel: Model<AlertReceiverDocument>,
    @InjectModel(CareLink.name) private readonly careLinkModel: Model<CareLinkDocument>,
    @InjectModel(NotificationToken.name) private readonly tokenModel: Model<NotificationTokenDocument>,
    private readonly liveStatus: LiveStatusService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async ingest(dto: {
    device_id: string;
    blind_user_id: string;
    distance_cm: number;
    detected?: boolean;
    sensor_type?: string;
    recorded_at: string;
  }) {
    const shouldSave = await this.liveStatus.shouldSaveDistance(dto.blind_user_id, dto.distance_cm);

    let saved: any = null;
    if (shouldSave) {
      saved = await this.telemetryModel.create({
        device_id: new Types.ObjectId(dto.device_id),
        blind_user_id: new Types.ObjectId(dto.blind_user_id),
        distance_cm: dto.distance_cm,
        detected: dto.detected ?? true,
        sensor_type: dto.sensor_type ?? 'ultrasonic',
        recorded_at: new Date(dto.recorded_at),
      });
    }

    const safetyStatus = await this.liveStatus.updateDistanceStatus(dto.blind_user_id, dto.distance_cm);
    await this.liveStatus.markDeviceLastSeen(dto.device_id);

    // Emit realtime
    this.realtimeGateway.emitToBlindUser(dto.blind_user_id, 'distance:updated', {
      distance_cm: dto.distance_cm,
      safety_status: safetyStatus,
    });

    // Create alert if danger
    if (dto.distance_cm < this.DANGER_CM) {
      const isDup = await this.liveStatus.isDuplicateAlert(dto.blind_user_id, AlertType.OBSTACLE_DANGER);
      if (!isDup) {
        await this.createDangerAlert(dto);
      }
    }

    return { saved: !!saved, safety_status: safetyStatus };
  }

  private async createDangerAlert(dto: {
    device_id: string;
    blind_user_id: string;
    distance_cm: number;
  }) {
    const alert = await this.alertModel.create({
      blind_user_id: new Types.ObjectId(dto.blind_user_id),
      device_id: new Types.ObjectId(dto.device_id),
      alert_type: AlertType.OBSTACLE_DANGER,
      risk_level: AlertRiskLevel.HIGH,
      status: 'open',
      title: 'Phat hien vat can nguy hiem',
      message: `Co vat can o khoang cach ${dto.distance_cm}cm`,
      distance_cm: dto.distance_cm,
      triggered_at: new Date(),
    });

    const guardianLinks = await this.careLinkModel
      .find({ blind_user_id: new Types.ObjectId(dto.blind_user_id), status: 'active', can_receive_alert: true })
      .lean();
    const guardianIds = guardianLinks.map((l) => l.guardian_user_id);
    if (guardianIds.length > 0) {
      await this.alertReceiverModel.insertMany(
        guardianIds.map((uid) => ({ alert_id: alert._id, user_id: uid })),
      );
      const tokens = await this.tokenModel
        .find({ user_id: { $in: guardianIds }, is_active: true })
        .lean();
      const fcmTokens = tokens.map((t) => t.token);
      if (fcmTokens.length > 0) {
        await this.notificationsService.sendPush(fcmTokens, {
          title: 'Canh bao vat can',
          body: `Co vat can o khoang cach ${dto.distance_cm}cm`,
          alert_id: String(alert._id),
        });
      }
    }

    this.realtimeGateway.emitToBlindUser(dto.blind_user_id, 'alert:created', {
      alert_id: String(alert._id),
      alert_type: AlertType.OBSTACLE_DANGER,
      risk_level: AlertRiskLevel.HIGH,
      distance_cm: dto.distance_cm,
    });
  }
}
