import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Model, Types } from 'mongoose';
import { ImageRequest, ImageRequestDocument } from 'src/database/schemas/image-request.schema';
import { VisionResult, VisionResultDocument } from 'src/database/schemas/vision-result.schema';
import { Alert, AlertDocument } from 'src/database/schemas/alert.schema';
import { AlertReceiver, AlertReceiverDocument } from 'src/database/schemas/alert-receiver.schema';
import { CareLink, CareLinkDocument } from 'src/database/schemas/care-link.schema';
import { NotificationToken, NotificationTokenDocument } from 'src/database/schemas/notification-token.schema';
import { UserLiveStatus, UserLiveStatusDocument } from 'src/database/schemas/user-live-status.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AlertType, AlertRiskLevel } from 'src/common/enums/app.enums';

@Injectable()
export class InternalService {
  private readonly logger = new Logger(InternalService.name);

  constructor(
    @InjectModel(ImageRequest.name) private readonly imageRequestModel: Model<ImageRequestDocument>,
    @InjectModel(VisionResult.name) private readonly visionResultModel: Model<VisionResultDocument>,
    @InjectModel(Alert.name) private readonly alertModel: Model<AlertDocument>,
    @InjectModel(AlertReceiver.name) private readonly alertReceiverModel: Model<AlertReceiverDocument>,
    @InjectModel(CareLink.name) private readonly careLinkModel: Model<CareLinkDocument>,
    @InjectModel(NotificationToken.name) private readonly tokenModel: Model<NotificationTokenDocument>,
    @InjectModel(UserLiveStatus.name) private readonly liveStatusModel: Model<UserLiveStatusDocument>,
    @InjectQueue('vision-jobs') private readonly visionQueue: Queue,
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
    if (!req) return { ok: false, error: 'Request not found' };

    await this.visionResultModel.create({
      image_request_id: new Types.ObjectId(dto.request_id),
      model_name: dto.model_name,
      model_version: dto.model_version,
      objects: dto.objects,
      nearest_obstacle_cm: dto.nearest_obstacle_cm,
      risk_level: dto.risk_level,
      summary_text: dto.summary_text,
      processed_at: new Date(),
    });

    req.status = 'done' as any;
    req.ai_status = 'done';
    await req.save();

    if (dto.risk_level === AlertRiskLevel.HIGH) {
      await this.createAlertFromVision(req, dto);
    }
    return { ok: true };
  }

  private async createAlertFromVision(req: ImageRequestDocument, dto: any) {
    const blindUserId = String(req.blind_user_id);
    const alert = await this.alertModel.create({
      blind_user_id: req.blind_user_id,
      device_id: req.device_id,
      image_request_id: req._id,
      alert_type: AlertType.AI_DETECTION_WARNING,
      risk_level: AlertRiskLevel.HIGH,
      status: 'open',
      title: 'Phat hien vat can nguy hiem',
      message: dto.summary_text || 'Obstacle detected',
      distance_cm: dto.nearest_obstacle_cm,
      triggered_at: new Date(),
    });

    const guardianLinks = await this.careLinkModel
      .find({ blind_user_id: req.blind_user_id, status: 'active', can_receive_alert: true })
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
          title: 'Phat hien vat can nguy hiem',
          body: dto.summary_text || 'Obstacle detected',
          alert_id: String(alert._id),
        });
      }
    }

    await this.liveStatusModel.findOneAndUpdate(
      { blind_user_id: req.blind_user_id },
      { current_safety_status: 'danger', last_alert_at: new Date(), updated_at: new Date() },
      { upsert: true },
    );

    this.realtimeGateway.emitToBlindUser(blindUserId, 'alert:created', {
      alert_id: String(alert._id),
      risk_level: AlertRiskLevel.HIGH,
      message: dto.summary_text,
    });
  }

  async retryJob(requestId: string) {
    const req = await this.imageRequestModel.findById(requestId);
    if (!req || !req.image_path) return { ok: false, error: 'No image attached' };
    await this.visionQueue.add(
      'process-image',
      { request_id: requestId, object_key: req.image_path },
      { attempts: 5, backoff: { type: 'exponential', delay: 3000 } },
    );
    req.ai_status = 'queued';
    req.status = 'queued' as any;
    await req.save();
    return { ok: true };
  }
}
