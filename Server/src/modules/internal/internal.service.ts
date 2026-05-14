import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Model, Types } from "mongoose";
import {
  ImageRequest,
  ImageRequestDocument,
} from "src/database/schemas/image-request.schema";
import {
  VisionResult,
  VisionResultDocument,
} from "src/database/schemas/vision-result.schema";
import { Alert, AlertDocument } from "src/database/schemas/alert.schema";
import {
  CareLink,
  CareLinkDocument,
} from "src/database/schemas/care-link.schema";
import {
  UserLiveStatus,
  UserLiveStatusDocument,
} from "src/database/schemas/user-live-status.schema";
import { NotificationsService } from "../notifications/notifications.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { AlertType, AlertRiskLevel } from "src/common/enums/app.enums";

@Injectable()
export class InternalService {
  private readonly logger = new Logger(InternalService.name);

  constructor(
    @InjectModel(ImageRequest.name)
    private readonly imageRequestModel: Model<ImageRequestDocument>,
    @InjectModel(VisionResult.name)
    private readonly visionResultModel: Model<VisionResultDocument>,
    @InjectModel(Alert.name) private readonly alertModel: Model<AlertDocument>,
    @InjectModel(CareLink.name)
    private readonly careLinkModel: Model<CareLinkDocument>,
    @InjectModel(UserLiveStatus.name)
    private readonly liveStatusModel: Model<UserLiveStatusDocument>,
    @InjectQueue("vision-jobs") private readonly visionQueue: Queue,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async saveVisionResult(dto: {
    request_id: string;
    model_name: string;
    model_version: string;
    objects: any[];
    nearest_obstacle_cm?: number;
    risk_level?: string;
    summary_text?: string;
  }) {
    const existing = await this.visionResultModel
      .findOne({ image_request_id: new Types.ObjectId(dto.request_id) })
      .lean();
    if (existing) return { ok: true, duplicate: true };

    const req = await this.imageRequestModel.findById(dto.request_id);
    if (!req) return { ok: false, error: "Request not found" };

    const visionResult = await this.visionResultModel.create({
      image_request_id: new Types.ObjectId(dto.request_id),
      model_name: dto.model_name,
      model_version: dto.model_version,
      objects: dto.objects,
      nearest_obstacle_cm: dto.nearest_obstacle_cm,
      risk_level: dto.risk_level || "low",
      summary_text: dto.summary_text,
      processed_at: new Date(),
    });

    req.ai_status = "completed";
    req.status = "completed" as any;
    req.ai_result_id = visionResult._id;
    await req.save();

    // If there's a danger, create alert
    if (dto.nearest_obstacle_cm && dto.nearest_obstacle_cm < 100) {
      await this.createAlertFromVision(req, dto);
    }

    return { ok: true, result_id: String(visionResult._id) };
  }

  private async createAlertFromVision(
    req: ImageRequestDocument,
    dto: {
      request_id: string;
      model_name: string;
      model_version: string;
      objects: any[];
      nearest_obstacle_cm?: number;
      risk_level?: string;
      summary_text?: string;
    },
  ) {
    const blindUserId = String(req.blind_user_id);

    const alert = await this.alertModel.create({
      blind_user_id: req.blind_user_id,
      device_id: req.device_id,
      alert_type: AlertType.OBSTACLE,
      risk_level: AlertRiskLevel.HIGH,
      status: "open",
      title: "Phát hiện vật cản nguy hiểm",
      message: dto.summary_text || "Obstacle detected",
      distance_cm: dto.nearest_obstacle_cm,
      triggered_at: new Date(),
    });

    // Fanout notification via NotificationService
    await this.notificationsService.createNotificationEvent({
      event_type: "alert",
      alert_id: alert._id,
      blind_user_id: req.blind_user_id,
      device_id: req.device_id,
      title: "Phát hiện vật cản nguy hiểm",
      message: dto.summary_text || "Obstacle detected",
      risk_level: "high",
    });

    await this.liveStatusModel.findOneAndUpdate(
      { blind_user_id: req.blind_user_id },
      {
        current_safety_status: "danger",
        last_alert_at: new Date(),
        updated_at: new Date(),
      },
      { upsert: true },
    );

    this.realtimeGateway.emitToBlindUser(blindUserId, "alert:created", {
      alert_id: String(alert._id),
      risk_level: AlertRiskLevel.HIGH,
      message: dto.summary_text,
    });
  }

  async retryJob(requestId: string) {
    const req = await this.imageRequestModel.findById(requestId);
    if (!req || !req.image_path)
      return { ok: false, error: "No image attached" };
    await this.visionQueue.add(
      "process-image",
      { request_id: requestId, object_key: req.image_path },
      { attempts: 5, backoff: { type: "exponential", delay: 3000 } },
    );
    req.ai_status = "queued";
    req.status = "queued" as any;
    await req.save();
    return { ok: true };
  }
}
