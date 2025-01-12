import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";

@Injectable()
export class FileRagModeService {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "file-rag-mode.service"
        })

        this.logger.info("Initializing FileRagModeService")
    }
}