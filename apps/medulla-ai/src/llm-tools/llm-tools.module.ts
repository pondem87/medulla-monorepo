import { Module } from '@nestjs/common';
import { LlmToolsService } from './llm-tools.service';
import { LlmToolsController } from './llm-tools.controller';
import { LLMProcessStateMachineProvider } from './state-machines/llm-process.state-machine.provider';
import { ChatMessageHistoryProvider } from './chat-message-history/chat-message-history-provider';
import { ChatMessageHistoryService } from './chat-message-history/chat-message-history.service';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatHistory } from './entities/chat-history.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { LLMModel } from './entities/llm-model.entity';
import { LLMPrefs } from './entities/llm-prefs.entity';
import { LangGraphAgentProvider } from './agents/langgraph-agent.provider';
import { LLMFuncToolsProvider } from './llm-func-tools.provider';
import { LLMPrefsService } from './llm-prefs.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { LLMModelService } from './llm-model.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SubscriptionService } from '../subscription/subscription.service';
import { ImageGenerationStateMachineProvider } from './state-machines/image-generation.state-machine.provider';
import { whatsappRmqClient } from '@app/medulla-common/common/constants';
import { WebSearchStateMachineProvider } from './state-machines/websearch.state-machine.provider';

@Module({
  imports: [TypeOrmModule.forFeature([ChatHistory, ChatMessage, LLMModel, LLMPrefs]), SubscriptionModule],
  controllers: [LlmToolsController],
  providers: [
    LlmToolsService,
    LLMProcessStateMachineProvider,
    ImageGenerationStateMachineProvider,
    ChatMessageHistoryProvider,
    ChatMessageHistoryService,
    WebSearchStateMachineProvider,
    SubscriptionService,
    LangGraphAgentProvider,
    LLMFuncToolsProvider,
    LLMPrefsService,
    LLMModelService,
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
  exports: [TypeOrmModule]
})
export class LlmToolsModule {}
