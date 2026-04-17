import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CareLink, CareLinkSchema } from 'src/database/schemas/care-link.schema';
import { CareLinksController } from './care-links.controller';
import { CareLinksService } from './care-links.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: CareLink.name, schema: CareLinkSchema }])],
  controllers: [CareLinksController],
  providers: [CareLinksService],
  exports: [CareLinksService],
})
export class CareLinksModule {}
