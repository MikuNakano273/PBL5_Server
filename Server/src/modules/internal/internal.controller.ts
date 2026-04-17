import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { InternalApiGuard } from 'src/common/guards/internal-api.guard';
import { InternalService } from './internal.service';

class VisionResultDto {
  @IsMongoId()
  request_id!: string;
  @IsString()
  model_name!: string;
  @IsString()
  model_version!: string;
  @IsArray()
  objects!: any[];
  @IsOptional()
  @IsNumber()
  nearest_obstacle_cm?: number;
  @IsOptional()
  @IsString()
  risk_level?: string;
  @IsOptional()
  @IsString()
  summary_text?: string;
}

class RetryJobDto {
  @IsMongoId()
  request_id!: string;
}

@ApiTags('Internal')
@UseGuards(InternalApiGuard)
@Controller('internal/v1')
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  @Post('vision/results')
  saveVisionResult(@Body() dto: VisionResultDto) {
    return this.internalService.saveVisionResult(dto);
  }

  @Post('jobs/retry')
  retryJob(@Body() dto: RetryJobDto) {
    return this.internalService.retryJob(dto.request_id);
  }
}
