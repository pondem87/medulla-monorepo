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
            this.getCompanyInfoTool()
        ]
    }

    getCompanyInfoTool(): DynamicTool {
        return tool(
            async () => {
                return "Pfitztronic Proprietary Limited was founded by Dr Tendai Precious Pfidze and incorporated in Botswana in 2024. We provide AI services, software development including firmware and custom electronics design. Visit our website www.pfitz.co.zw or email on tpp@pfitz.co.zw for more information. Our new product Medulla is meant to provide convenient access to LLM services through Whatsapp. At its full maturity it will provide multimodal functionality allowing you to send pictures, audio and video as input and provide output in the same manner."
            },
            {
                name: "pfitztronic-info",
                description: "Get more information about Pfitztronic"
            }
        )
    }
}