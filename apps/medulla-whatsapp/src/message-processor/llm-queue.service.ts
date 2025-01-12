import { LLMEventPattern, llmRmqClient } from "@app/medulla-common/common/constants";
import { LLMQueueMessage } from "@app/medulla-common/common/message-queue-types";
import { Contact } from "@app/medulla-common/common/whatsapp-api-types";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Logger } from "winston";

@Injectable()
export class LLMQueueService {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        @Inject(llmRmqClient)
        private readonly llmQueueClient: ClientProxy
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "llm-queue.service"
        })

        this.logger.info("Initializing LLMQueueService")
    }

    sendPlainTextToLLM(contact: Contact, prompt: string): void {
        const payload: LLMQueueMessage = {
            contact,
            prompt,
            ragMode: false
        }

        this.llmQueueClient.emit(
            LLMEventPattern,
            payload
        )
    }
}