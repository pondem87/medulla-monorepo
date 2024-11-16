import { NestFactory } from '@nestjs/core';
import { MedullaAiModule } from './medulla-ai.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(MedullaAiModule);
  const config = app.get<ConfigService>(ConfigService)

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`${config.get<string>("MEDULLA_RMQ_URL")}:${config.get<string>("MEDULLA_RMQ_PORT")}`],
      queue: config.get<string>("MEDULLA_LLM_QUEUE_NAME"),
      queueOptions: {
        durable: config.get<string>("MEDULLA_RMQ_QUEUE_DURABLE") === "true" ? true : false
      }
    }
  })

  await app.startAllMicroservices()

  const port = parseInt(config.get<string>("MEDULLA_AI_PORT")) || 3000
  await app.listen(port);
}
bootstrap();
