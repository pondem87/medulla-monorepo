import { Module } from '@nestjs/common';
import { MessageProcessorService } from './message-processor.service';
import { MessageProcessorController } from './message-processor.controller';
import { InteractiveStateMachineService } from './interactive.state-machine.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { LLMQueueService } from './llm-queue.service';
import { HomeStateService } from './home-state.service';
import { InteractiveProcessesService } from './interactive.processes.service';
import { FileRagModeService } from './file-rag-mode.service';
import { FileUploadService } from './file-upload.service';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { llmRmqClient, whatsappRmqClient } from '../common/constants';
import { MessageProcessingStateMachineProvider } from './message-processing.state-machine.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersistedInteractiveState } from './entities/persisted-interactive-state';

@Module({
  imports: [TypeOrmModule.forFeature([PersistedInteractiveState])],
  controllers: [MessageProcessorController],
  providers: [
    MessageProcessorService,
    LLMQueueService,
    InteractiveStateMachineService,
    InteractiveProcessesService,
    MessageProcessingStateMachineProvider,
    HomeStateService,
    FileRagModeService,
    FileUploadService,
    LoggingService,
    {
      provide: llmRmqClient,
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>("MEDULLA_RMQ_URL")],
            queue: configService.get<string>("MEDULLA_LLM_QUEUE_NAME"),
            queueOptions: {
              durable: configService.get<boolean>("MEDULLA_RMQ_QUEUE_DURABLE")
            },
          },
        });
      },
      inject: [ConfigService],
    },
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
  exports: [TypeOrmModule]
})
export class MessageProcessorModule {}
