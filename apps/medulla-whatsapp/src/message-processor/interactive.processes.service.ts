import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { HomeStateService } from "./home-state.service";
import { StateMachineActor } from "@app/medulla-common/common/types";
import { ISMContext, ISMEventType } from "./interactive.state-machine";
import { Messages } from "./dto/message.dto";

@Injectable()
export class InteractiveProcessesService {

    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly homeStateService: HomeStateService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "interactive.processes.service"
        })

        this.logger.info("Initializing InteractiveProcessesService")
    }

    async processMessage(ismActor: StateMachineActor<ISMEventType, ISMContext>, message: Messages) {
        
        if (await this.homeStateService.runImplementedStates(ismActor, message)) {
            return true
        } else {
            this.logger.warn("Could not match state.", {state: ismActor.getSnapshot().value})
            return false
        }
    }
}