import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Roles, RolesSchema } from '../../modules/roles/schemas/roles.schema';
import { User, UserSchema } from '../../modules/users/schemas/users.schema';
import { PaymentMethod, PaymentMethodSchema } from '../../modules/payment-method/schemas/payment-method.schema';
import { Regions, RegionsSchema } from '../../modules/regions/schemas/regions.schema';

import { RolesSeeder } from './roles.seeder';
import { UsersSeeder } from './users.seeder';
import { PaymentMethodSeeder } from './payment-method.seeder';
import { RegionsSeeder } from './regions.seeder';
import { DuesPeriodsSeeder } from './dues-periods.seeder';
import { DuesPeriods, DuesPeriodsSchema } from '../../modules/dues-periods/schemas/dues-periods.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: Roles.name, schema: RolesSchema },
      { name: User.name, schema: UserSchema },
      { name: PaymentMethod.name, schema: PaymentMethodSchema },
      { name: Regions.name, schema: RegionsSchema },
      { name: DuesPeriods.name, schema: DuesPeriodsSchema },
    ]),
  ],
  providers: [
    RolesSeeder, 
    UsersSeeder, 
    PaymentMethodSeeder,
    RegionsSeeder,
    DuesPeriodsSeeder
  ],
})
export class SeederModule {}