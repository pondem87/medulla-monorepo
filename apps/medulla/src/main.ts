import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService>(ConfigService)
  const port = parseInt(config.get<string>("MEDULLA_ADMIN_PORT")) || 3000
  await app.listen(3000);
}

bootstrap();
