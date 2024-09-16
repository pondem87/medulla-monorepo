import { NestFactory } from '@nestjs/core';
import { StorageModule } from './storage.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(StorageModule);
  
  const config = app.get<ConfigService>(ConfigService)

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [config.get<string>("RMQ_WA_URL")],
      queue: config.get<string>("RMQ_WA_QUEUE_NAME"),
      queueOptions: {
        durable: config.get<boolean>("RMQ_WA_QUEUE_DURABLE")
      }
    }
  })

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'hero',
      protoPath: join(__dirname, 'hero/hero.proto'),
      url: ""
    },
  });

  await app.startAllMicroservices()
}

bootstrap();
