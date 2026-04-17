import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CareLink, CareLinkDocument } from 'src/database/schemas/care-link.schema';

@Injectable()
export class CareLinksService {
  constructor(@InjectModel(CareLink.name) private readonly careLinkModel: Model<CareLinkDocument>) {}

  async getLinksForUser(userId: string, role: string) {
    if (role === 'guardian') {
      return this.careLinkModel
        .find({ guardian_user_id: new Types.ObjectId(userId), status: 'active' })
        .lean();
    }
    return this.careLinkModel
      .find({ blind_user_id: new Types.ObjectId(userId), status: 'active' })
      .lean();
  }

  async getGuardianIdsForBlindUser(blindUserId: string): Promise<string[]> {
    const links = await this.careLinkModel
      .find({ blind_user_id: new Types.ObjectId(blindUserId), status: 'active', can_receive_alert: true })
      .lean();
    return links.map((l) => String(l.guardian_user_id));
  }
}
