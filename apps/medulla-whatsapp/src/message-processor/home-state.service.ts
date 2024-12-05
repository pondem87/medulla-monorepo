import { StateMachineActor } from "@app/medulla-common/common/types";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { ISMContext, ISMEventType } from "./interactive.state-machine";
import { Messages } from "./dto/message.dto";
import { IRunStates } from "./types";
import { LLMQueueService } from "./llm-queue.service";

@Injectable()
export class HomeStateService implements IRunStates {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly llmQueueService: LLMQueueService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "home-state.service"
        })

        this.logger.info("Initializing HomeStateService")
    }

    async runImplementedStates(ismActor: StateMachineActor<ISMEventType, ISMContext>, message: Messages): Promise<boolean> {
        if (ismActor.getSnapshot().matches("home")) {
            return await this.processHomeMessage(ismActor, message)
        } else {
            return false
        }
    }

    async processHomeMessage(ismActor: StateMachineActor<ISMEventType, ISMContext>, message: Messages): Promise<boolean> {
        if (message.text) {
            // process text via llm
            await this.llmQueueService.sendPlainTextToLLM(ismActor.getSnapshot().context.contact, message.text.body)
            return true
        } else if (message.interactive?.list_reply) {
            // menu selection
            return false
        }
    }

}