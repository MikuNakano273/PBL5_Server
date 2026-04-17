import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ collection: 'audit_logs', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class AuditLog {
  @Prop({ required: true, index: true })
  actor_type!: string; // 'user' | 'device' | 'system'

  @Prop({ required: true, index: true })
  actor_id!: string;

  @Prop({ required: true, index: true })
  action!: string;

  @Prop({ index: true })
  resource_type?: string;

  @Prop()
  resource_id?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
