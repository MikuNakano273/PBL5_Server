import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DeviceStatus } from 'src/common/enums/app.enums';

export type DeviceDocument = HydratedDocument<Device>;

@Schema({ collection: 'devices', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Device {
  @Prop({ required: true, unique: true, index: true })
  serial_number!: string;

  @Prop({ required: true, unique: true, index: true })
  device_code!: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  owner_blind_user_id!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop()
  firmware_version?: string;

  @Prop({ enum: DeviceStatus, default: DeviceStatus.ACTIVE, index: true })
  status!: DeviceStatus;

  @Prop()
  last_seen_at?: Date;

  @Prop()
  last_battery?: number;

  @Prop()
  last_known_ip?: string;

  @Prop()
  device_secret_hash?: string;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
