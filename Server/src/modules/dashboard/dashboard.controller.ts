import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Mobile Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':blindUserId')
  getDashboard(@Param('blindUserId') blindUserId: string) {
    return this.dashboardService.getDashboard(blindUserId);
  }
}
