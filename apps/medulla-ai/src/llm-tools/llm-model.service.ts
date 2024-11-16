import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LLMModel } from "./entities/llm-model.entity";
import { Repository } from "typeorm";
import { Logger } from "winston";

@Injectable()
export class LLMModelService {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        @InjectRepository(LLMModel)
        private readonly llmModelRepository: Repository<LLMModel>
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "llm-model.service"
        })
    }

    async getModel(modelName: string): Promise<LLMModel|null> {
        try {
            return await this.llmModelRepository.findOneBy({name: modelName})
        } catch (error) {
            this.logger.error("Failed to retrieve model from repository", error)
            return null
        }
    }
}