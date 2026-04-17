import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserLiveStatusDocument = HydratedDocument<UserLiveStatus>;

@Schema({ collection: 'user_live_status', timestamps: { createdAt: false, updatedAt: 'updated_at' } })
export class UserLiveStatus {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  blind_user_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  device_id?: Types.ObjectId;

  @Prop({ default: 'safe', index: true })
  current_safety_status!: string; // 'safe' | 'warning' | 'danger' | 'offline'

  @Prop()
  nearest_distance_cm?: number;

  @Prop({ type: Object })
  last_location?: { lat: number; lng: number; accuracy?: number };

  @Prop()
  last_alert_at?: Date;

  @Prop()
  last_seen_at?: Date;
}

export const UserLiveStatusSchema = SchemaFactory.createForClass(UserLiveStatus);
