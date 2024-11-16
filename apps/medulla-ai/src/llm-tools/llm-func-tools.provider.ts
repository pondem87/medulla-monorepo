import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { DynamicTool, tool } from "@langchain/core/tools";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";

@Injectable()
export class LLMFuncToolsProvider {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "llm-func-tools.provider"
        })

        this.logger.info("Initializing LLMToolsProvider")
    }

    getTools({userId}: {userId: string}): DynamicTool[] {
        return [
            this.getSendMenuTool()
        ]
    }

    getSendMenuTool(): DynamicTool {
        return tool(
            async () => {
                return "Current menu sent to client."
            },
            {
                name: "send-menu",
                description: "Send menu to client."
            }
        )
    }
}