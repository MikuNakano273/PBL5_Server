import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CareLinksService } from './care-links.service';

@ApiTags('Mobile Care Links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/v1/care-links')
export class CareLinksController {
  constructor(private readonly careLinksService: CareLinksService) {}

  @Get()
  getCareLinks(@CurrentUser() user: { userId: string; role: string }) {
    return this.careLinksService.getLinksForUser(user.userId, user.role);
  }
}
