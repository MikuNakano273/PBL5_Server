import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationTokenDocument = HydratedDocument<NotificationToken>;

@Schema({ collection: 'notification_tokens', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class NotificationToken {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  user_id!: Types.ObjectId;

  @Prop({ required: true, enum: ['android', 'ios', 'web'] })
  platform!: string;

  @Prop({ required: true, unique: true, index: true })
  token!: string;

  @Prop({ default: true })
  is_active!: boolean;

  @Prop()
  last_used_at?: Date;
}

export const NotificationTokenSchema = SchemaFactory.createForClass(NotificationToken);
