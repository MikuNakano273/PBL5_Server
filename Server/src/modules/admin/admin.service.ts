import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/database/schemas/user.schema';
import { Device, DeviceDocument } from 'src/database/schemas/device.schema';
import { ImageRequest, ImageRequestDocument } from 'src/database/schemas/image-request.schema';
import { Alert, AlertDocument } from 'src/database/schemas/alert.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Device.name) private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(ImageRequest.name) private readonly imageRequestModel: Model<ImageRequestDocument>,
    @InjectModel(Alert.name) private readonly alertModel: Model<AlertDocument>,
  ) {}

  async listUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.userModel.find().select('-password_hash').sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(),
    ]);
    return { items, page, limit, total };
  }

  async listDevices(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.deviceModel.find().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      this.deviceModel.countDocuments(),
    ]);
    return { items, page, limit, total };
  }

  async listVisionRequests(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.imageRequestModel.find().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      this.imageRequestModel.countDocuments(),
    ]);
    return { items, page, limit, total };
  }

  async listAlerts(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.alertModel.find().sort({ triggered_at: -1 }).skip(skip).limit(limit).lean(),
      this.alertModel.countDocuments(),
    ]);
    return { items, page, limit, total };
  }
}
