import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ImageRequestStatus } from 'src/common/enums/app.enums';

export type ImageRequestDocument = HydratedDocument<ImageRequest>;

@Schema({ collection: 'image_requests', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ImageRequest {
  @Prop({ required: true, unique: true, index: true })
  request_code!: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  device_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  blind_user_id!: Types.ObjectId;

  @Prop({ required: true })
  captured_at!: Date;

  @Prop()
  distance_cm?: number;

  @Prop({ type: Object })
  gps_snapshot?: Record<string, unknown>;

  @Prop()
  image_path?: string;

  @Prop({ enum: ImageRequestStatus, default: ImageRequestStatus.CREATED, index: true })
  status!: ImageRequestStatus;

  @Prop({ default: 'pending', index: true })
  ai_status!: string;

  @Prop()
  error_message?: string;
}

export const ImageRequestSchema = SchemaFactory.createForClass(ImageRequest);
ImageRequestSchema.index({ ai_status: 1, created_at: 1 });
