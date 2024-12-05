import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LLMPrefs } from "./entities/llm-prefs.entity";
import { Logger } from "winston";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LLMPrefsService {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        @InjectRepository(LLMPrefs)
        private readonly llmPrefsRepository: Repository<LLMPrefs>,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "llm-prefs.service"
        })

        this.logger.info("initialize LLMPrefsService")
    }

    async getPrefs(userId: string): Promise<LLMPrefs|null> {
        try {
            const prefs = await this.llmPrefsRepository.findOne({where: { userId }})
            if (prefs) {
                return prefs
            } else {
                const newPrefs = new LLMPrefs()
                newPrefs.chatModel = this.configService.get<string>("DEFAULT_CHAT_MODEL")
                newPrefs.imageModel = this.configService.get<string>("DEFAULT_IMAGE_MODEL")
                newPrefs.embeddingModel = this.configService.get<string>("DEFAULT_EMBEDDING_MODEL")
                newPrefs.userId = userId
                return await this.llmPrefsRepository.save(newPrefs)
            }
        } catch (error) {
            this.logger.error("Failed to retrieve LLMPrefs.", error)
            throw new Error("Database operation failed: Retrieve LLMPrefs")
        }
    }
}