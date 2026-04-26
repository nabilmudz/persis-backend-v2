import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';
import { Regions, RegionsSchema } from './schemas/regions.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Regions.name, schema: RegionsSchema },
    ]),
  ],
  controllers: [RegionsController],
  providers: [RegionsService],
  exports: [RegionsService],
})
export class RegionsModule {}
