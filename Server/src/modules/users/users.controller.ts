import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@ApiTags('Mobile Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/v1/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getMe(@CurrentUser() user: { userId: string }) {
    return this.usersService.findById(user.userId);
  }
}
