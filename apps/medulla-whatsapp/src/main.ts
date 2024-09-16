import { NestFactory } from '@nestjs/core';
import { MedullaWhatsappModule } from './medulla-whatsapp.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(MedullaWhatsappModule);
  const config = app.get<ConfigService>(ConfigService)

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [config.get<string>("MEDULLA_RMQ_URL")],
      queue: config.get<string>("WHATSAPP_RMQ_QUEUE_NAME"),
      queueOptions: {
        durable: config.get<string>("MEDULLA_RMQ_QUEUE_DURABLE") === "true" ? true : false
      }
    }
  })

  await app.startAllMicroservices()

  const port = parseInt(config.get<string>("MEDULLA_WHATSAPP_PORT")) || 3001
  await app.listen(port);
  
}
bootstrap();