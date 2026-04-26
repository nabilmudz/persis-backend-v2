import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DuesPeriodsController } from './dues-periods.controller';
import { DuesPeriodsService } from './dues-periods.service';
import { DuesPeriods, DuesPeriodsSchema } from './schemas/dues-periods.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DuesPeriods.name, schema: DuesPeriodsSchema },
    ]),
  ],
  controllers: [DuesPeriodsController],
  providers: [DuesPeriodsService],
  exports: [DuesPeriodsService],
})
export class DuesPeriodsModule {}
