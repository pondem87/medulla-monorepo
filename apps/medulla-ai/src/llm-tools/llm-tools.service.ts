import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { LLMProcessStateMachineProvider } from './state-machines/llm-process.state-machine.provider';
import { AnyActorRef, waitFor } from 'xstate';
import { LLMQueueMessage } from '@app/medulla-common/common/message-queue-types';

@Injectable()
export class LlmToolsService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly llmProcessStateMachineProvider: LLMProcessStateMachineProvider
    ) {
        this.logger = this.loggingService.getLogger({
            module: "medulla-ai",
            file: "medulla-ai.controller"
        })

        this.logger.info("Initializing MedullaAIController")
    }

    async processPayload(payload: LLMQueueMessage): Promise<boolean> {
        const llmProcessActor = this.llmProcessStateMachineProvider.getActor({
            contact: payload.contact,
            prompt: payload.prompt,
            ragFileId: payload.ragFileId,
            ragModeType: payload.ragModeType,
            ragMode: payload.ragMode
        })

        llmProcessActor.start()

        await waitFor(
            llmProcessActor as AnyActorRef,
            (snapshot) => snapshot.hasTag("final")
        )

        if (llmProcessActor.getSnapshot().matches("ProcessFailure")) {
			this.logger.error("Failed to process message", {error: llmProcessActor.getSnapshot().context.error})
            return false
		}

        return true
    }
}