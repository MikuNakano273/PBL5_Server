import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DistanceTelemetryDocument = HydratedDocument<DistanceTelemetry>;

@Schema({ collection: 'distance_telemetry', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class DistanceTelemetry {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  device_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  blind_user_id!: Types.ObjectId;

  @Prop({ required: true })
  distance_cm!: number;

  @Prop({ default: true })
  detected!: boolean;

  @Prop({ default: 'ultrasonic' })
  sensor_type!: string;

  @Prop({ required: true, index: true })
  recorded_at!: Date;
}

export const DistanceTelemetrySchema = SchemaFactory.createForClass(DistanceTelemetry);
DistanceTelemetrySchema.index({ blind_user_id: 1, recorded_at: -1 });
