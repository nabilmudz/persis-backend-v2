import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { RolesSeeder } from './roles.seeder';
import { UsersSeeder } from './users.seeder';
import { PaymentMethodSeeder } from './payment-method.seeder';
import { RegionsSeeder } from './regions.seeder'
import { DuesPeriodsSeeder } from './dues-periods.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);

  await app.get(RolesSeeder).seed();
  await app.get(PaymentMethodSeeder).seed();
  await app.get(RegionsSeeder).seed();
  await app.get(UsersSeeder).seed();
  await app.get(DuesPeriodsSeeder).seed();

  await app.close();
  process.exit(0);
}

bootstrap();