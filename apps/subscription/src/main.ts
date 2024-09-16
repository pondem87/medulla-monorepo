import { NestFactory } from '@nestjs/core';
import { SubscriptionModule } from './subscription.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(SubscriptionModule);
  
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

  await app.startAllMicroservices()
}
bootstrap();
