import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { RolesSeeder } from './roles.seeder';
import { UsersSeeder } from './users.seeder';
import { PaymentMethodSeeder } from './payment-method.seeder';
import { RegionsSeeder } from './regions.seeder'
import { DuesPeriodsSeeder } from './dues-periods.seeder';

const seeders: Record<string, { instance: any; name: string }> = {
  roles: { instance: RolesSeeder, name: 'Roles' },
  users: { instance: UsersSeeder, name: 'Users' },
  'payment-method': { instance: PaymentMethodSeeder, name: 'Payment Methods' },
  regions: { instance: RegionsSeeder, name: 'Regions' },
  'dues-periods': { instance: DuesPeriodsSeeder, name: 'Dues Periods' },
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);

  const target = process.argv.find(a => a.startsWith('--seeder='))?.split('=')[1];

  if (target) {
    const entry = seeders[target];
    if (!entry) {
      console.error(`Unknown seeder: "${target}". Available: ${Object.keys(seeders).join(', ')}`);
      await app.close();
      process.exit(1);
    }
    await app.get(entry.instance).seed();
    console.log(`  ${entry.name} seeded successfully`);
  } else {
    const order = ['roles', 'payment-method', 'regions', 'users', 'dues-periods'];
    for (const key of order) {
      await app.get(seeders[key].instance).seed();
    }
  }

  await app.close();
  process.exit(0);
}

bootstrap();