import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/users.schema';
import jwtConfig from '../../config/jwt.config';
import { EmailModule } from '../../helper/mail/email.module';
import { OtpModule } from '../otp/otp.module';
import { TransactionItems, TransactionItemsSchema } from '../transaction-item/schemas/transaction-item.schema';
import { DuesPeriods, DuesPeriodsSchema } from '../dues-periods/schemas/dues-periods.schema';

@Module({
  imports: [
    EmailModule,
    OtpModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: TransactionItems.name, schema: TransactionItemsSchema },
      { name: DuesPeriods.name, schema: DuesPeriodsSchema },
    ]),
    ConfigModule.forFeature(jwtConfig),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}