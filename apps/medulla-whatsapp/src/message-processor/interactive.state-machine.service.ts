import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Logger } from "winston";
import { PersistedInteractiveState } from "./entities/persisted-interactive-state";
import { Repository } from "typeorm";

@Injectable()
export class InteractiveStateMachineService {

    private logger: Logger

    constructor (
        @InjectRepository(PersistedInteractiveState)
        private readonly interactiveSateRepository: Repository<PersistedInteractiveState>,
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "interactive.state-machine.service"
        })

        this.logger.info("Initializing InteractiveStateMachineService")
    }

    async getPersistedInteractiveState(userNumber: string): Promise<PersistedInteractiveState|null> {
        try {
            return await this.interactiveSateRepository.findOneBy({userId: userNumber})
        } catch(error) {
            this.logger.error("Failed to retrieve persisted state machine (PersistedInteractiveState)", error)
            return null
        }
    }

    async savePersistedInteractiveState(state: PersistedInteractiveState): Promise<PersistedInteractiveState|null> {
        try {
            return await this.interactiveSateRepository.save(state)
        } catch (error) {
            return null
        }
    }
}