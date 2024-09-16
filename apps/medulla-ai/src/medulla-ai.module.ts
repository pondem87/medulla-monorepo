import { Module } from '@nestjs/common';
import { MedullaAIController } from './medulla-ai.controller';
import { MedullaAIService } from './medulla-ai.service';
import { VectorStoreModule } from './vector-store/vector-store.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { whatsappRmqClient } from './common/constants';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { MedullaCommonModule } from '@app/medulla-common';
import { LoggingService } from '@app/medulla-common/logging/logging.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "./env/medulla-ai/.env"]}),
    VectorStoreModule,
    MedullaCommonModule
  ],
  controllers: [MedullaAIController],
  providers: [
    MedullaAIService,
    LoggingService,
    {
      provide: whatsappRmqClient,
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>("MEDULLA_RMQ_URL")],
            queue: configService.get<string>("WHATSAPP_RMQ_QUEUE_NAME"),
            queueOptions: {
              durable: configService.get<boolean>("MEDULLA_RMQ_QUEUE_DURABLE")
            },
          },
        });
      },
      inject: [ConfigService],
    }
  ],
})
export class MedullaAiModule {}
