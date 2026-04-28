import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BankAccountController } from './bank-account.controller';
import { BankAccountService } from './bank-account.service';
import { BankAccounts, BankAccountsSchema } from './schemas/bank-account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BankAccounts.name, schema: BankAccountsSchema },
    ]),
  ],
  controllers: [BankAccountController],
  providers: [BankAccountService],
  exports: [BankAccountService],
})
export class BankAccountModule {}
