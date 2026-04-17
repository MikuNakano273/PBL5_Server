import { Body, Controller, Param, Post } from '@nestjs/common';
import { IsDateString, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { ImageRequestsService } from './image-requests.service';

class CreateImageRequestDto {
  @IsMongoId()
  device_id!: string;

  @IsMongoId()
  blind_user_id!: string;

  @IsDateString()
  captured_at!: string;

  @IsOptional()
  @IsNumber()
  distance_cm?: number;
}

class AttachImageDto {
  @IsString()
  object_key!: string;
}

@Controller('cane/v1/requests')
export class ImageRequestsController {
  constructor(private readonly imageRequestsService: ImageRequestsService) {}

  @Post()
  create(@Body() dto: CreateImageRequestDto) {
    return this.imageRequestsService.create(dto);
  }

  @Post(':requestId/image')
  attachImage(@Param('requestId') requestId: string, @Body() dto: AttachImageDto) {
    return this.imageRequestsService.attachImage(requestId, dto.object_key);
  }
}
