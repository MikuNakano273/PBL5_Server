import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DistanceTelemetry, DistanceTelemetryDocument } from 'src/database/schemas/distance-telemetry.schema';
import { GpsLog, GpsLogDocument } from 'src/database/schemas/gps-log.schema';

@Injectable()
export class CleanupTelemetryJob {
  private readonly logger = new Logger(CleanupTelemetryJob.name);

  constructor(
    @InjectModel(DistanceTelemetry.name) private readonly telemetryModel: Model<DistanceTelemetryDocument>,
    @InjectModel(GpsLog.name) private readonly gpsModel: Model<GpsLogDocument>,
  ) {}

  @Cron('0 3 * * *') // daily at 3am
  async cleanupOldRecords() {
    const distanceDays = parseInt(process.env.TELEMETRY_RETENTION_DAYS || '7', 10);
    const gpsDays = parseInt(process.env.GPS_RETENTION_DAYS || '30', 10);
    const distanceCutoff = new Date(Date.now() - distanceDays * 86400_000);
    const gpsCutoff = new Date(Date.now() - gpsDays * 86400_000);

    const [dr, gr] = await Promise.all([
      this.telemetryModel.deleteMany({ recorded_at: { $lt: distanceCutoff } }),
      this.gpsModel.deleteMany({ recorded_at: { $lt: gpsCutoff } }),
    ]);
    this.logger.log(`Cleanup: removed ${dr.deletedCount} telemetry, ${gr.deletedCount} GPS records`);
  }
}
