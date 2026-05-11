import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { Transactions, TransactionsSchema } from './schemas/transaction.schema';
import { TransactionItems, TransactionItemsSchema } from '../transaction-item/schemas/transaction-item.schema';
import { DuesPeriods, DuesPeriodsSchema } from '../dues-periods/schemas/dues-periods.schema';
import { User, UserSchema } from '../users/schemas/users.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transactions.name, schema: TransactionsSchema },
      { name: TransactionItems.name, schema: TransactionItemsSchema },
      { name: DuesPeriods.name, schema: DuesPeriodsSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}