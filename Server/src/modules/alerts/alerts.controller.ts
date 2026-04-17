import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AlertsService } from './alerts.service';

@ApiTags('Mobile Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/v1/alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get(':blindUserId')
  list(
    @Param('blindUserId') blindUserId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.alertsService.listByBlindUser(blindUserId, Number(page), Number(limit));
  }

  @Get(':blindUserId/recent')
  recent(@Param('blindUserId') blindUserId: string) {
    return this.alertsService.recentAlerts(blindUserId, 10);
  }

  @Get(':blindUserId/stats/today')
  todayStats(@Param('blindUserId') blindUserId: string) {
    return this.alertsService.todayStats(blindUserId);
  }
}
