import { Body, Controller, Post } from '@nestjs/common';
import { IsBoolean, IsDateString, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { TelemetryService } from './telemetry.service';

class DistanceIngestDto {
  @IsMongoId()
  device_id!: string;

  @IsMongoId()
  blind_user_id!: string;

  @IsNumber()
  distance_cm!: number;

  @IsOptional()
  @IsBoolean()
  detected?: boolean;

  @IsOptional()
  @IsString()
  sensor_type?: string;

  @IsDateString()
  recorded_at!: string;
}

@Controller('cane/v1/telemetry/distance')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  ingest(@Body() dto: DistanceIngestDto) {
    return this.telemetryService.ingest(dto);
  }
}
