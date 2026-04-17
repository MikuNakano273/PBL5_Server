import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/app.enums';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/v1')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.listUsers(Number(page), Number(limit));
  }

  @Get('devices')
  listDevices(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.listDevices(Number(page), Number(limit));
  }

  @Get('vision/requests')
  listVisionRequests(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.listVisionRequests(Number(page), Number(limit));
  }

  @Get('alerts')
  listAlerts(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.listAlerts(Number(page), Number(limit));
  }
}
