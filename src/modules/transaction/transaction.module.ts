import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule, InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { Transactions, TransactionsSchema } from './schemas/transaction.schema';
import { TransactionItems, TransactionItemsSchema, TransactionItemsDocument } from '../transaction-item/schemas/transaction-item.schema';
import { DuesPeriods, DuesPeriodsSchema } from '../dues-periods/schemas/dues-periods.schema';
import { User, UserSchema } from '../users/schemas/users.schema'
import { RegionsModule } from '../regions/regions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transactions.name, schema: TransactionsSchema },
      { name: TransactionItems.name, schema: TransactionItemsSchema },
      { name: DuesPeriods.name, schema: DuesPeriodsSchema },
      { name: User.name, schema: UserSchema },
    ]),
    RegionsModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule implements OnModuleInit {
  constructor(
    @InjectModel(TransactionItems.name) private txnItemModel: Model<TransactionItemsDocument>,
  ) {}

  async onModuleInit() {
    await this.txnItemModel.updateMany(
      { _active: { $exists: false }, status: { $ne: 'rejected' } },
      { $set: { _active: true } },
    );
    await this.txnItemModel.updateMany(
      { _active: { $exists: false }, status: 'rejected' },
      { $set: { _active: false } },
    );
    await this.txnItemModel.syncIndexes();
  }
}