import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CareLinkDocument = HydratedDocument<CareLink>;

@Schema({ collection: 'care_links', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class CareLink {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  blind_user_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  guardian_user_id!: Types.ObjectId;

  @Prop({ default: 'family' })
  relation!: string;

  @Prop({ default: 'active', index: true })
  status!: string;

  @Prop({ default: true })
  can_view_live_location!: boolean;

  @Prop({ default: true })
  can_receive_alert!: boolean;
}

export const CareLinkSchema = SchemaFactory.createForClass(CareLink);
CareLinkSchema.index({ blind_user_id: 1, guardian_user_id: 1 }, { unique: true });
