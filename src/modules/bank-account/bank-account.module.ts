import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { BankAccountController } from './bank-account.controller';
import { BankAccountService } from './bank-account.service';
import { BankAccounts, BankAccountsSchema } from './schemas/bank-account.schema';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BankAccounts.name, schema: BankAccountsSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [BankAccountController],
  providers: [BankAccountService, JwtStrategy],
  exports: [BankAccountService],
})
export class BankAccountModule {}
