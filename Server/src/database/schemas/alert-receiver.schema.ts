import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AlertReceiverDocument = HydratedDocument<AlertReceiver>;

@Schema({ collection: 'alert_receivers', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class AlertReceiver {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  alert_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  user_id!: Types.ObjectId;

  @Prop({ default: false })
  is_push_sent!: boolean;

  @Prop()
  push_sent_at?: Date;

  @Prop()
  viewed_at?: Date;

  @Prop()
  acknowledged_at?: Date;
}

export const AlertReceiverSchema = SchemaFactory.createForClass(AlertReceiver);
AlertReceiverSchema.index({ alert_id: 1, user_id: 1 }, { unique: true });
