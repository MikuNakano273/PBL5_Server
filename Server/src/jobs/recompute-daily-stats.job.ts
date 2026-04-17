import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alert, AlertDocument } from 'src/database/schemas/alert.schema';
import { UserLiveStatus, UserLiveStatusDocument } from 'src/database/schemas/user-live-status.schema';

@Injectable()
export class RecomputeDailyStatsJob {
  private readonly logger = new Logger(RecomputeDailyStatsJob.name);

  constructor(
    @InjectModel(Alert.name) private readonly alertModel: Model<AlertDocument>,
    @InjectModel(UserLiveStatus.name) private readonly liveStatusModel: Model<UserLiveStatusDocument>,
  ) {}

  @Cron('0 0 * * *') // midnight
  async recompute() {
    const allUsers = await this.liveStatusModel.find().lean();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    for (const u of allUsers) {
      const count = await this.alertModel.countDocuments({
        blind_user_id: u.blind_user_id,
        triggered_at: { $gte: startOfDay },
      });
      this.logger.debug(`User ${u.blind_user_id}: ${count} alerts today`);
    }
    this.logger.log('Daily stats recomputed');
  }
}
