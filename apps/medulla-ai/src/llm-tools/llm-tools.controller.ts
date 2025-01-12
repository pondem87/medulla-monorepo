import { Controller } from '@nestjs/common';
import { LlmToolsService } from './llm-tools.service';
import { EventPattern } from '@nestjs/microservices';
import { Logger } from 'winston';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { LLMEventPattern } from '@app/medulla-common/common/constants';
import { LLMQueueMessage } from '@app/medulla-common/common/message-queue-types';

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