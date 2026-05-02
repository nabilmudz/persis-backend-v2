import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TransactionItemController } from './transaction-item.controller';
import { TransactionItemService } from './transaction-item.service';
import { TransactionItems, TransactionItemsSchema } from '../transaction-item/schemas/transaction-item.schema';
import { DuesPeriods, DuesPeriodsSchema } from '../dues-periods/schemas/dues-periods.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TransactionItems.name, schema: TransactionItemsSchema, },
      { name: DuesPeriods.name, schema: DuesPeriodsSchema },
    ]),
  ],
  controllers: [TransactionItemController],
  providers: [TransactionItemService],
  exports: [TransactionItemService],
})
export class TransactionItemModule {}
