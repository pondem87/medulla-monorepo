import { Controller } from '@nestjs/common';
import { LlmToolsService } from './llm-tools.service';
import { LLMEventPattern } from '../common/constants';
import { EventPattern } from '@nestjs/microservices';
import { LLMQueueMessage } from './dto/llm-queue-message.dto';
import { Logger } from 'winston';
import { LoggingService } from '@app/medulla-common/logging/logging.service';

@Controller()
export class LlmToolsController {
	private logger: Logger

	constructor(
		private readonly llmToolsService: LlmToolsService,
		private readonly loggingService: LoggingService
	) {
		this.logger = this.loggingService.getLogger({
			module: "llm-tools",
			file: "llm-tools.controller"
		})

		this.logger.info("Initializing LlmToolsController")
	}

	@EventPattern(LLMEventPattern)
	async processPayload(payload: LLMQueueMessage): Promise<boolean> {
		return this.llmToolsService.processPayload(payload)
	}
}