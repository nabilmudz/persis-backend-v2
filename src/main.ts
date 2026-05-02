import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setDefaultResultOrder } from 'dns';
import { Resolver } from 'dns/promises';

const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

setDefaultResultOrder('ipv4first');
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();