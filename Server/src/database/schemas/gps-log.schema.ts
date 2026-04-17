import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GpsLogDocument = HydratedDocument<GpsLog>;

@Schema({ collection: 'gps_logs', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class GpsLog {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  device_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  blind_user_id!: Types.ObjectId;

  @Prop({ required: true })
  lat!: number;

  @Prop({ required: true })
  lng!: number;

  @Prop({ type: Object, index: '2dsphere' })
  location?: { type: 'Point'; coordinates: [number, number] };

  @Prop()
  accuracy?: number;

  @Prop()
  speed?: number;

  @Prop()
  heading?: number;

  @Prop({ required: true, index: true })
  recorded_at!: Date;
}

export const GpsLogSchema = SchemaFactory.createForClass(GpsLog);
GpsLogSchema.index({ blind_user_id: 1, recorded_at: -1 });
