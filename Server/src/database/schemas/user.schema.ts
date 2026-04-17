import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from 'src/common/enums/app.enums';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true })
  password_hash!: string;

  @Prop({ required: true })
  full_name!: string;

  @Prop()
  phone?: string;

  @Prop({ enum: UserRole, required: true, index: true })
  role!: UserRole;

  @Prop({ default: 'active', index: true })
  status!: string;

  @Prop()
  avatar_url?: string;

  @Prop()
  last_login_at?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
