import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Device, DeviceDocument } from 'src/database/schemas/device.schema';
import { InjectModel as InjectModelAlias } from '@nestjs/mongoose';
import { UserLiveStatus, UserLiveStatusDocument } from 'src/database/schemas/user-live-status.schema';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name) private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(UserLiveStatus.name) private readonly liveStatusModel: Model<UserLiveStatusDocument>,
  ) {}

  async findOne(deviceId: string) {
    const device = await this.deviceModel.findById(new Types.ObjectId(deviceId)).lean();
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async heartbeat(deviceId: string, battery?: number, ip?: string) {
    const device = await this.deviceModel.findByIdAndUpdate(
      new Types.ObjectId(deviceId),
      { last_seen_at: new Date(), ...(battery !== undefined && { last_battery: battery }), ...(ip && { last_known_ip: ip }) },
      { new: true },
    ).lean();
    if (!device) throw new NotFoundException('Device not found');

    await this.liveStatusModel.findOneAndUpdate(
      { blind_user_id: device.owner_blind_user_id },
      { device_id: device._id, last_seen_at: new Date(), updated_at: new Date() },
      { upsert: true },
    );
    return { ok: true };
  }

  async getConfig(deviceId: string) {
    return {
      device_id: deviceId,
      heartbeat_interval_ms: parseInt(process.env.DEVICE_HEARTBEAT_INTERVAL_MS || '30000', 10),
      gps_interval_ms: parseInt(process.env.DEVICE_GPS_INTERVAL_MS || '5000', 10),
      telemetry_interval_ms: parseInt(process.env.DEVICE_TELEMETRY_INTERVAL_MS || '500', 10),
      danger_distance_cm: parseInt(process.env.ALERT_DISTANCE_DANGER_CM || '100', 10),
      warning_distance_cm: parseInt(process.env.ALERT_DISTANCE_WARNING_CM || '150', 10),
    };
  }
}
