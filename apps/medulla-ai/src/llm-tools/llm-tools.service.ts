import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { LLMQueueMessage } from './dto/llm-queue-message.dto';

@Injectable()
export class LlmToolsService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "medulla-ai",
            file: "medulla-ai.controller"
        })

        this.logger.info("Initializing MedullaAIController")
    }

    async processPayload(payload: LLMQueueMessage): Promise<void> {
        
    }
}