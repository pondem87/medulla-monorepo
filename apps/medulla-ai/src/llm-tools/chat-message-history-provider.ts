import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { ChatMessageHistory } from './chat-message-history';
import { ChatMessageHistoryService } from './chat-message-history.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';

@Injectable()
export class ChatMessageHistoryProvider {

    private logger: Logger
    private chatHistoryWindowLength: number

    constructor(
        private readonly loggingService: LoggingService,
        private readonly chatMessageHistoryService: ChatMessageHistoryService,
        private readonly config: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "chat-message-history-provider"
        })

        this.logger.info("Constructing ChatMessageHistoryProvider")

        this.chatHistoryWindowLength = parseInt(this.config.get<string>("CHAT_HISTORY_WINDOW_LENGTH")) || 10
    }

    async getChatMessageHistory(config: { userNumber: string }): Promise<ChatMessageHistory> {
        const chatMessageHistory = new ChatMessageHistory(
            this.logger,
            this.chatMessageHistoryService,
            this.chatHistoryWindowLength
        )

        await chatMessageHistory.init(config)

        return chatMessageHistory
    }
}
