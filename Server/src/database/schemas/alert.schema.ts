import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AlertRiskLevel, AlertType } from 'src/common/enums/app.enums';

export type AlertDocument = HydratedDocument<Alert>;

@Schema({ collection: 'alerts', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Alert {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  blind_user_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  device_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true })
  image_request_id?: Types.ObjectId;

  @Prop({ enum: AlertType, required: true, index: true })
  alert_type!: AlertType;

  @Prop({ enum: AlertRiskLevel, required: true, index: true })
  risk_level!: AlertRiskLevel;

  @Prop({ default: 'open', index: true })
  status!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop()
  lat?: number;

  @Prop()
  lng?: number;

  @Prop()
  distance_cm?: number;

  @Prop({ required: true, index: true })
  triggered_at!: Date;

  @Prop()
  resolved_at?: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
AlertSchema.index({ blind_user_id: 1, triggered_at: -1 });
