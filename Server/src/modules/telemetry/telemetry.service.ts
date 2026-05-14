import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  DistanceTelemetry,
  DistanceTelemetryDocument,
} from "src/database/schemas/distance-telemetry.schema";
import { Alert, AlertDocument } from "src/database/schemas/alert.schema";
import {
  CareLink,
  CareLinkDocument,
} from "src/database/schemas/care-link.schema";
import { LiveStatusService } from "../realtime/live-status.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { NotificationsService } from "../notifications/notifications.service";
import { AlertType, AlertRiskLevel } from "src/common/enums/app.enums";

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly DANGER_CM = parseInt(
    process.env.ALERT_DISTANCE_DANGER_CM || "100",
    10,
  );

  constructor(
    @InjectModel(DistanceTelemetry.name)
    private readonly telemetryModel: Model<DistanceTelemetryDocument>,
    @InjectModel(Alert.name) private readonly alertModel: Model<AlertDocument>,
    @InjectModel(CareLink.name)
    private readonly careLinkModel: Model<CareLinkDocument>,
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
    const shouldSave = await this.liveStatus.shouldSaveDistance(
      dto.blind_user_id,
      dto.distance_cm,
    );

    let saved: any = null;
    if (shouldSave) {
      saved = await this.telemetryModel.create({
        device_id: new Types.ObjectId(dto.device_id),
        blind_user_id: new Types.ObjectId(dto.blind_user_id),
        distance_cm: dto.distance_cm,
        detected: dto.detected ?? true,
        sensor_type: dto.sensor_type ?? "ultrasonic",
        recorded_at: new Date(dto.recorded_at),
      });
    }

    await this.liveStatus.updateDistance(
      dto.blind_user_id,
      dto.device_id,
      dto.distance_cm,
    );

    if (dto.distance_cm < this.DANGER_CM) {
      await this.createDangerAlert(dto);
    }

    return { saved: !!saved, distance_cm: dto.distance_cm };
  }

  private async createDangerAlert(dto: {
    device_id: string;
    blind_user_id: string;
    distance_cm: number;
    detected?: boolean;
    sensor_type?: string;
    recorded_at: string;
  }) {
    const blindUserId = String(dto.blind_user_id);

    const recentAlert = await this.alertModel
      .findOne({
        device_id: new Types.ObjectId(dto.device_id),
        alert_type: AlertType.OBSTACLE,
        triggered_at: { $gte: new Date(Date.now() - 30 * 1000) },
      })
      .lean();

    if (recentAlert) {
      this.logger.debug(`Recent alert found within 30s, skipping duplicate`);
      return;
    }

    const alert = await this.alertModel.create({
      blind_user_id: new Types.ObjectId(dto.blind_user_id),
      device_id: new Types.ObjectId(dto.device_id),
      alert_type: AlertType.OBSTACLE,
      risk_level: AlertRiskLevel.HIGH,
      status: "open",
      title: "Canh bao vat can",
      message: `Phát hiện vật cản ở khoảng cách ${dto.distance_cm}cm`,
      distance_cm: dto.distance_cm,
      triggered_at: new Date(),
    });

    // Fanout notification via NotificationService (new v3 workflow)
    await this.notificationsService.createNotificationEvent({
      event_type: "alert",
      alert_id: alert._id,
      blind_user_id: new Types.ObjectId(dto.blind_user_id),
      device_id: new Types.ObjectId(dto.device_id),
      title: "Canh bao vat can",
      message: `Phát hiện vật cản ở khoảng cách ${dto.distance_cm}cm`,
      risk_level: "high",
    });

    await this.liveStatus.updateDanger(dto.blind_user_id);

    this.realtimeGateway.emitToBlindUser(blindUserId, "alert:created", {
      alert_id: String(alert._id),
      risk_level: AlertRiskLevel.HIGH,
      distance_cm: dto.distance_cm,
    });
  }

  async getAllDistanceTelemetry(blindUserId: string, limit = 100, skip = 0) {
    return this.telemetryModel
      .find({ blind_user_id: new Types.ObjectId(blindUserId) })
      .sort({ recorded_at: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  async getDistanceTelemetryByDevice(deviceId: string, limit = 100, skip = 0) {
    return this.telemetryModel
      .find({ device_id: new Types.ObjectId(deviceId) })
      .sort({ recorded_at: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }
}
