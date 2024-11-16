import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from 'winston';
import { Conversation } from './entities/conversation.entity';
import { SentMessage } from './entities/sent-message.entity';
import { MoreThan, Repository } from 'typeorm';

@Injectable()
export class MetricsService {
    private logger: Logger

    constructor(
        private loggingService: LoggingService,
        @InjectRepository(Conversation)
        private readonly conversationRepository: Repository<Conversation>,
        @InjectRepository(SentMessage)
        private readonly sentMessageRepository: Repository<SentMessage>
    ) {
        this.logger = this.loggingService.getLogger({
            module: "metrics",
            file: "metrics.service"
        })

        this.logger.info("Initialising MetricsService")
    }

    async createConversation(userId: string): Promise<Conversation|null> {
        try {
            return await this.conversationRepository.save(
                this.conversationRepository.create({
                    userId: userId
                })
            )
        } catch (error) {
            this.logger.error("Failed to create conversation", error)
            return null
        }
    }

    async findValidConversation(userId: string): Promise<Conversation|null> {
        try {
            const convs = await this.conversationRepository.find({
                where: {
                    expiry: MoreThan(new Date(new Date().setHours(new Date().getHours() - 24)))
                },
                order: {
                    expiry: "DESC"
                }
            })

            if (convs.length > 0) return convs[0]
            else return null
        } catch (error) {
            
        }
    }

    async createSentMessage(userId: string, wamid: string, payload: string, conversation: Conversation|null): Promise<SentMessage|null> {
        try {
            return await this.sentMessageRepository.save(
                this.sentMessageRepository.create({
                    userId,
                    wamid,
                    messageBody: payload,
                    conversation
                })
            )
        } catch (error) {
            this.logger.error("Failed to save sent message")
            return null
        }
    }
}
