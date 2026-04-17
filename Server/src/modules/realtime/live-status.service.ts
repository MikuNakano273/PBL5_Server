import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Redis } from 'ioredis';
import { UserLiveStatus, UserLiveStatusDocument } from 'src/database/schemas/user-live-status.schema';

@Injectable()
export class LiveStatusService implements OnModuleInit {
  private readonly logger = new Logger(LiveStatusService.name);
  private redis: Redis;

  private readonly DANGER_CM = parseInt(process.env.ALERT_DISTANCE_DANGER_CM || '100', 10);
  private readonly WARNING_CM = parseInt(process.env.ALERT_DISTANCE_WARNING_CM || '150', 10);
  private readonly OFFLINE_SECS = parseInt(process.env.DEVICE_OFFLINE_THRESHOLD_SECONDS || '60', 10);

  constructor(
    @InjectModel(UserLiveStatus.name) private readonly liveStatusModel: Model<UserLiveStatusDocument>,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    });
  }

  onModuleInit() {
    this.redis.on('error', (e) => this.logger.error('Redis error', e));
  }

  /** Call after each distance telemetry ingest */
  async updateDistanceStatus(blindUserId: string, distanceCm: number) {
    const key = `user:${blindUserId}:latest_distance`;
    await this.redis.setex(key, 300, String(distanceCm));

    const status = this.computeSafetyFromDistance(distanceCm);
    await this.redis.setex(`user:${blindUserId}:current_status`, 300, status);

    await this.liveStatusModel.findOneAndUpdate(
      { blind_user_id: new Types.ObjectId(blindUserId) },
      {
        nearest_distance_cm: distanceCm,
        current_safety_status: status,
        last_seen_at: new Date(),
        updated_at: new Date(),
      },
      { upsert: true },
    );
    return status;
  }

  /** Call after each GPS ingest */
  async updateLocationStatus(blindUserId: string, lat: number, lng: number, accuracy?: number) {
    const loc = JSON.stringify({ lat, lng, accuracy });
    await this.redis.setex(`user:${blindUserId}:latest_location`, 300, loc);
    await this.liveStatusModel.findOneAndUpdate(
      { blind_user_id: new Types.ObjectId(blindUserId) },
      { last_location: { lat, lng, accuracy }, last_seen_at: new Date(), updated_at: new Date() },
      { upsert: true },
    );
  }

  async markDeviceLastSeen(deviceId: string) {
    await this.redis.setex(`device:${deviceId}:last_seen`, this.OFFLINE_SECS * 3, Date.now().toString());
  }

  async isDeviceOffline(deviceId: string): Promise<boolean> {
    const val = await this.redis.get(`device:${deviceId}:last_seen`);
    if (!val) return true;
    return Date.now() - Number(val) > this.OFFLINE_SECS * 1000;
  }

  /** Check if we should save this telemetry sample (sampling filter) */
  async shouldSaveDistance(blindUserId: string, newDistance: number): Promise<boolean> {
    const SAMPLING_MIN_MS = parseInt(process.env.DISTANCE_SAMPLING_MIN_MS || '1500', 10);
    const MIN_DELTA_CM = 10;
    const key = `device:${blindUserId}:last_saved_distance_at`;
    const lastKey = `user:${blindUserId}:latest_distance`;
    const [lastSavedAt, lastDist] = await Promise.all([
      this.redis.get(key),
      this.redis.get(lastKey),
    ]);
    const now = Date.now();
    const timePassed = !lastSavedAt || now - Number(lastSavedAt) >= SAMPLING_MIN_MS;
    const distChanged = !lastDist || Math.abs(newDistance - Number(lastDist)) >= MIN_DELTA_CM;
    if (timePassed || distChanged) {
      await this.redis.setex(key, 600, String(now));
      return true;
    }
    return false;
  }

  /** Dedup alert: returns true if alert is duplicate and should be skipped */
  async isDuplicateAlert(blindUserId: string, alertType: string): Promise<boolean> {
    const DEDUP_SECS = parseInt(process.env.ALERT_DEDUP_SECONDS || '30', 10);
    const key = `alert_dedup:${blindUserId}:${alertType}`;
    const set = await this.redis.set(key, '1', 'EX', DEDUP_SECS, 'NX');
    return set === null; // null means key already existed -> duplicate
  }

  async getDashboardStatus(blindUserId: string) {
    const [distRaw, locRaw, statusRaw] = await Promise.all([
      this.redis.get(`user:${blindUserId}:latest_distance`),
      this.redis.get(`user:${blindUserId}:latest_location`),
      this.redis.get(`user:${blindUserId}:current_status`),
    ]);
    return {
      nearest_distance_cm: distRaw !== null ? Number(distRaw) : null,
      last_location: locRaw ? JSON.parse(locRaw) : null,
      current_safety_status: statusRaw || 'unknown',
    };
  }

  private computeSafetyFromDistance(cm: number): string {
    if (cm < this.DANGER_CM) return 'danger';
    if (cm < this.WARNING_CM) return 'warning';
    return 'safe';
  }
}
