import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { assign, createActor, fromPromise, setup } from "xstate";
import { MessengerRMQMessage } from "./dto/messenger-rmq-message.dto";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { MetricsService } from "../metrics/metrics.service";
import { MessageBody, TextMessageBody } from "./types";
import { Conversation } from "../metrics/entities/conversation.entity";
import { StateMachineActor } from "@app/medulla-common/common/types";
import { GraphAPIService } from "./graph-api.service";

@Injectable()
export class MessengerProcessStateMachineProvider {
    private logger: Logger
    private MessengerProcessStateMachine = setup({
        types: {
            events: {} as MPSMEventType,
            context: {} as MPSMContext,
            input: {} as MPSMInput,
            children: {} as {
                prepareMessage: "prepareMessage";
                checkConversation: "checkConversation";
                sendMessage: "sendMessage";
            }
        },
        actors: {
            prepareMessage: fromPromise(async ({ input }: { input: { context: MPSMContext } }) => {
                return await this.prepareMessage(input)
            }),
            checkConversation: fromPromise(async ({ input }: { input: { context: MPSMContext } }) => {
                return await this.checkConversation(input)
            }),
            sendMessage: fromPromise(async ({ input }: { input: { context: MPSMContext } }) => {
                return await this.sendMessage(input)
            })
        }
    })
        .createMachine({
            id: "messenger-process",
            context: ({ input }) => ({
                payload: input.payload
            }),
            initial: "PreparingMessage",
            states: {
                PreparingMessage: {
                    invoke: {
                        id: "prepareMessage",
                        src: "prepareMessage",
                        input: ({ context }) => ({ context }),
                        onDone: {
                            target: "CheckingConversation",
                            actions: assign({
                                messageBody: ({ event }) => event.output
                            })
                        },
                        onError: {
                            target: "Failure",
                            actions: assign({
                                error: ({ event }) => event.error
                            })
                        }
                    }
                },
                CheckingConversation: {
                    invoke: {
                        id: "checkConversation",
                        src: "checkConversation",
                        input: ({ context }) => ({ context }),
                        onDone: {
                            target: "SendingMessage",
                            actions: assign({
                                conversation: ({ event }) => event.output
                            })
                        },
                        onError: {
                            target: "Failure",
                            actions: assign({
                                error: ({ event }) => event.error
                            })
                        }
                    }
                },
                SendingMessage: {
                    invoke: {
                        id: "sendMessage",
                        src: "sendMessage",
                        input: ({ context }) => ({ context }),
                        onDone: {
                            target: "Complete",
                        },
                        onError: {
                            target: "Failure",
                            actions: assign({
                                error: ({ event }) => event.error
                            })
                        }
                    }
                },
                Complete: {
                    tags: ["final", "success"]
                },
                Failure: {
                    tags: ["final", "failure"]
                }
            }
        })

    constructor(
        private readonly loggingService: LoggingService,
        private readonly metricsService: MetricsService,
        private readonly graphApiService: GraphAPIService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "whatsapp-messenger",
            file: "messenger-process.state-machine.provider"
        })
    }

    getMachineActor(input: MPSMInput): StateMachineActor<MPSMEventType, MPSMContext> {
        return createActor(this.MessengerProcessStateMachine, { input }) as StateMachineActor<MPSMEventType, MPSMContext>
    }

    prepareMessage(input: { context: MPSMContext; }): MessageBody[] {

        const context = input.context

        switch (context.payload.type) {
            case "text":

                let msgBody: TextMessageBody[] = []

                const maxMsgChars = 4096

                const numberOfChunks = Math.ceil(context.payload.text?.length / maxMsgChars)

                for (let i = 0; i < numberOfChunks; i++) {
                    const start = i * maxMsgChars;
                    const end = start + maxMsgChars;
                    msgBody.push({
                        messaging_product: "whatsapp",
                        recipient_type: "individual",
                        to: context.payload.contact.wa_id,
                        type: "text",
                        text: {
                            body: context.payload.text?.slice(start, end),
                            preview_url: true
                        }
                    })
                }

                return msgBody

            default:
                this.logger.error("Failed to prepare message", context)
                return null
        }
    }

    async checkConversation(input: { context: MPSMContext; }): Promise<Conversation> {
        let conversation = await this.metricsService.findValidConversation(input.context.payload.contact.wa_id)
        if (conversation != null) return conversation

        // create a new conversation if service message
        if (input.context.payload.conversationType === "service") {
            conversation = await this.metricsService.createConversation(input.context.payload.contact.wa_id)
        }

        return conversation
    }

    async sendMessage(input: { context: MPSMContext; }): Promise<boolean> {

        for (const body of input.context.messageBody) {
            const response = await this.graphApiService.messages(body)

            if (response !== null) {
                await this.metricsService.createSentMessage(
                    body.to,
                    response.messages[0].id,
                    JSON.stringify(body),
                    input.context.conversation
                )
            } else {
                return false
            }
        }

        return true

    }
}

export type MPSMEventType = { type: string }

export type MPSMContext = {
    payload: MessengerRMQMessage,
    messageBody?: MessageBody[],
    conversation?: Conversation,
    error?: any
}

export type MPSMInput = {
    payload: MessengerRMQMessage
}