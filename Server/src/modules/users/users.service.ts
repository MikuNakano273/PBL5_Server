import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/database/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findById(id: string) {
    const user = await this.userModel.findById(new Types.ObjectId(id)).lean();
    if (!user) throw new NotFoundException('User not found');
    const { password_hash, ...safe } = user as any;
    return safe;
  }

  async updateFcmToken(_userId: string, _token: string) {
    // Handled via notifications module
    return { success: true };
  }
}
