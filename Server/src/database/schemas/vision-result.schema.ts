import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AlertRiskLevel } from 'src/common/enums/app.enums';

export type VisionResultDocument = HydratedDocument<VisionResult>;

interface DetectedObject {
  label: string;
  confidence: number;
  bbox?: number[];
}

@Schema({ collection: 'vision_results', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class VisionResult {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  image_request_id!: Types.ObjectId;

  @Prop({ default: 'yolov8' })
  model_name!: string;

  @Prop({ default: '1.0' })
  model_version!: string;

  @Prop({ type: [Object], default: [] })
  objects!: DetectedObject[];

  @Prop()
  nearest_obstacle_cm?: number;

  @Prop({ enum: AlertRiskLevel })
  risk_level?: string;

  @Prop()
  summary_text?: string;

  @Prop({ required: true })
  processed_at!: Date;
}

export const VisionResultSchema = SchemaFactory.createForClass(VisionResult);
