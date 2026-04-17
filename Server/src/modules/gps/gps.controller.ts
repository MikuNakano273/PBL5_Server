import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsNumber, IsOptional } from 'class-validator';
import { GpsService } from './gps.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CareLinkGuard } from 'src/common/guards/care-link.guard';
import { MongooseModule } from '@nestjs/mongoose';

class GpsIngestDto {
  @IsMongoId()
  device_id!: string;
  @IsMongoId()
  blind_user_id!: string;
  @IsNumber()
  lat!: number;
  @IsNumber()
  lng!: number;
  @IsOptional()
  @IsNumber()
  accuracy?: number;
  @IsOptional()
  @IsNumber()
  speed?: number;
  @IsOptional()
  @IsNumber()
  heading?: number;
  @IsDateString()
  recorded_at!: string;
}

@ApiTags('GPS')
@Controller()
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post('cane/v1/gps')
  ingest(@Body() dto: GpsIngestDto) {
    return this.gpsService.ingest(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mobile/v1/locations/:blindUserId/history')
  getHistory(
    @Param('blindUserId') blindUserId: string,
    @Query('limit') limit = '50',
  ) {
    return this.gpsService.getHistory(blindUserId, Number(limit));
  }
}
