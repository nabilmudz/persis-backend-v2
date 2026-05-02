import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { DuesPeriodsModule } from './modules/dues-periods/dues-periods.module';
import { PaymentMethodModule } from './modules/payment-method/payment-method.module';
import { RegionsModule } from './modules/regions/regions.module';
import { RolesModule } from './modules/roles/roles.module';
import { TransactionItemModule } from './modules/transaction-item/transaction-item.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { UsersModule } from './modules/users/users.module';
import { BankAccountModule } from './modules/bank-account/bank-account.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI')
      }),
    }),
    RolesModule,
    UsersModule,
    PaymentMethodModule,
    RegionsModule,
    DuesPeriodsModule,
    TransactionItemModule,
    TransactionModule,
    BankAccountModule
  ],
})
export class AppModule {}