import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsOptional } from 'class-validator';
import { DevicesService } from './devices.service';

class HeartbeatDto {
  @IsMongoId()
  device_id!: string;
  @IsOptional()
  @IsNumber()
  battery?: number;
}

@ApiTags('Cane Devices')
@Controller()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('cane/v1/heartbeat')
  heartbeat(@Body() dto: HeartbeatDto, @Req() req: any) {
    const ip = req.ip || req.headers['x-forwarded-for'];
    return this.devicesService.heartbeat(dto.device_id, dto.battery, ip);
  }

  @Get('cane/v1/devices/:deviceId/config')
  getConfig(@Param('deviceId') deviceId: string) {
    return this.devicesService.getConfig(deviceId);
  }

  @Get('mobile/v1/devices/:deviceId')
  findOne(@Param('deviceId') deviceId: string) {
    return this.devicesService.findOne(deviceId);
  }
}
