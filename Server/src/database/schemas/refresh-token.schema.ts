import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({ collection: 'refresh_tokens', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  user_id!: Types.ObjectId;

  @Prop({ required: true, index: true })
  token_hash!: string;

  @Prop({ required: true })
  expires_at!: Date;

  @Prop()
  revoked_at?: Date;

  @Prop({ type: Object })
  device_info?: Record<string, string>;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
RefreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
