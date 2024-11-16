import { Injectable } from "@nestjs/common";
import { StoredMessage } from "@langchain/core/messages";
import { InjectRepository } from "@nestjs/typeorm";
import { ChatHistory } from "./entities/chat-history.entity";
import { Repository } from "typeorm";
import { Logger } from "winston";
import { ChatMessage } from "./entities/chat-message.entity";
import { LoggingService } from "@app/medulla-common/logging/logging.service";


@Injectable()
export class ChatMessageHistoryService {

	private logger: Logger

	constructor(
		@InjectRepository(ChatHistory)
		private readonly chatHistoryRepository: Repository<ChatHistory>,
		@InjectRepository(ChatMessage)
		private readonly chatMessageRepository: Repository<ChatMessage>,
		private readonly loggingService: LoggingService
	) {
		this.logger = this.loggingService.getLogger({
			module: "llm-tools",
			file: "chat-message-history.service"
		})
	}

	async getUsersChatHistory(userNumber: string): Promise<ChatHistory | null> {
		try {
			return await this.chatHistoryRepository.findOne({
				where: {
					userId: userNumber
				}
			})
		} catch (error) {
			this.logger.error("Error retrieving chathistory from database.", {error})
			return null
		}
	}

	async createChatMessage(chatHistory: ChatHistory, message: StoredMessage): Promise<ChatMessage | null> {
        try {
			const chatMessage = new ChatMessage()
			chatMessage.chatHistory = chatHistory
			chatMessage.message = message
			return await this.chatMessageRepository.save(chatMessage)
		} catch (error) {
			this.logger.error("")
			return null
		}
    }

	async getChatMessages(chatHistory: ChatHistory, chatHistoryWindowLength: number): Promise<ChatMessage[]> {
        try {
			return await this.chatMessageRepository.find({
				where: {
					chatHistory: {
						id: chatHistory.id
					}
				},
				take: chatHistoryWindowLength
			})
		} catch (error) {
			this.logger.error("Error retrieving messages", {error})
			return []
		}
    }
	
    async saveChatHistory(chatHistory: ChatHistory): Promise<ChatHistory|null> {
        try {
			return await this.chatHistoryRepository.save(chatHistory)
		} catch (error) {
			this.logger.error("Error saving chatHistory", {error})
			return null
		}
    }
}