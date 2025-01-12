import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { ISMContext, ISMEventType } from "../interactive.state-machine.provider";
import { LLMQueueService } from "../llm-queue.service";
import { ClientProxy } from "@nestjs/microservices";
import { MainMenuItems, MessengerEventPattern, whatsappRmqClient } from "@app/medulla-common/common/constants";
import { MessengerRMQMessage } from "@app/medulla-common/common/message-queue-types";

@Injectable()
export class HomeStateService {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly llmQueueService: LLMQueueService,
        @Inject(whatsappRmqClient)
        private readonly whatsappQueueClient: ClientProxy
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "home-state.service"
        })

        this.logger.info("Initializing HomeStateService")
    }

    executeHomeState = async ({ context }: { context: ISMContext}): Promise<ISMEventType> => {
        const message = context.message
        if (message == null) {
            this.logger.error("message cannot be null in executeHomeState({ context }: { context: ISMContext})")
            throw new Error("message cannot be null in executeHomeState({ context }: { context: ISMContext})")
        }
        switch (message.type) {
            case "text":
                // process text via llm
                this.llmQueueService.sendPlainTextToLLM(context.contact, message.text.body)
                return {type: "nochange"}
            
            case "interactive":
                switch (message.interactive.type) {
                    case "list_reply":
                        // menu selection
                        switch (message.interactive.list_reply.id) {
                            case MainMenuItems[0].id:
                                return { type: "startPayment" }
                            case MainMenuItems[1].id:
                                const messageDefaultMessage: MessengerRMQMessage = {
                                    contact: context.contact,
                                    type: "text",
                                    conversationType: "service",
                                    text: `Sorry, this menu option (${MainMenuItems[1].title}) is still under development.`
                                }
                                this.whatsappQueueClient.emit(
                                    MessengerEventPattern,
                                    messageDefaultMessage
                                )
                                return {type: "nochange"}
                            default:
                                const listReplyDefaultMessage: MessengerRMQMessage = {
                                    contact: context.contact,
                                    type: "text",
                                    conversationType: "service",
                                    text: `Sorry, your selection "${message.interactive.list_reply.title}" is not a valid Home Menu option.`
                                }
                                this.whatsappQueueClient.emit(
                                    MessengerEventPattern,
                                    listReplyDefaultMessage
                                )
                                return {type: "nochange"}
                        }
                    default:
                        const interactiveDefaultMessage: MessengerRMQMessage = {
                            contact: context.contact,
                            type: "text",
                            conversationType: "service",
                            text: `Sorry, the interactive message is not a valid Home Menu option.`
                        }
                        this.whatsappQueueClient.emit(
                            MessengerEventPattern,
                            interactiveDefaultMessage
                        )
                        return {type: "nochange"}
                }
        
            default:
                const messageDefaultMessage: MessengerRMQMessage = {
                    contact: context.contact,
                    type: "text",
                    conversationType: "service",
                    text: `Sorry, the message type is not supported.`
                }
                this.whatsappQueueClient.emit(
                    MessengerEventPattern,
                    messageDefaultMessage
                )
                return {type: "nochange"}
        }
        
    }

}