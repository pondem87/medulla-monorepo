import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";

@Injectable()
export class ZimMobilePayments {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "interactive.processes.service"
        })

        this.logger.info("Initializing InteractiveProcessesService")
    }
}