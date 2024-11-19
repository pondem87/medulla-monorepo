import { assign, createActor, createMachine, fromPromise, setup } from "xstate";
import { Contact } from "../dto/contact.dto";
import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { Money, StateMachineActor } from "@app/medulla-common/common/types";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { LLMPrefsService } from "./llm-prefs.service";
import { LLMCallbackHandler } from "./llm-callback-handler";
import { LangGraphAgentProvider } from "./langgraph-agent.provider";
import { LLMFuncToolsProvider } from "./llm-func-tools.provider";
import { ChatMessageHistory } from "./chat-message-history";
import { ChatMessageHistoryProvider } from "./chat-message-history-provider";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { BASE_CURRENCY_ISO, MessengerEventPattern, whatsappRmqClient } from "../common/constants";
import { ClientProxy } from "@nestjs/microservices";
import { MessengerRMQMessage } from "./dto/messenger-rmq-message.dto";
import { LLMModelService } from "./llm-model.service";
import { addMoney, getTotalCost } from "@app/medulla-common/common/functions";
import { ConfigService } from "@nestjs/config";
import { SubscriptionService } from "../subscription/subscription.service";

@Injectable()
export class LLMProcessStateMachineProvider {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly subscriptionService: SubscriptionService,
        private readonly llmPrefsService: LLMPrefsService,
        private readonly langGraphAgentProvider: LangGraphAgentProvider,
        private readonly llmFuncToolsProvider: LLMFuncToolsProvider,
        private readonly chatMessageHistoryProvider: ChatMessageHistoryProvider,
        private readonly llmModelService: LLMModelService,
        private readonly configService: ConfigService,
        @Inject(whatsappRmqClient)
        private readonly whatsappRMQClient: ClientProxy
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "llm-process.state-machine.provider"
        })

        this.logger.info("initialize LLMProcessStateMachineProvider")
    }

    getActor(input: LPSInput): StateMachineActor<any, LPSContext> {
        return createActor(this.setUpStateMachine(), { input }) as StateMachineActor<any, LPSContext>
    }

    checkUserBalance = async ({ input }: { input: { userId: string } }) => {
        const { amount, multiplier, currency } = await this.subscriptionService.checkUserBalance(input)
        this.logger.debug("Checked user balance.", { amount: BigInt(amount), multiplier: BigInt(multiplier), currency })
        return { amount: BigInt(amount), multiplier: BigInt(multiplier), currency }
    }

    initializeLLMTools = async ({ input }: { input: { userId: string } }) => {
        const llmPrefs = await this.llmPrefsService.getPrefs(input.userId)
        const textModelName = llmPrefs.chatModel
        const handler = new LLMCallbackHandler()

        const compliledGraph = this.langGraphAgentProvider.getAgent(textModelName, handler, this.llmFuncToolsProvider.getTools(input))

        const chatMessageHistory = await this.chatMessageHistoryProvider.getChatMessageHistory({ userNumber: input.userId })

        return { chatMessageHistory, textModelName, handler, compliledGraph }
    }

    generateResponse = async ({ input }: { input: { context: LPSContext } }) => {

        let response: string

        const chargeLLMService: boolean = this.configService.get<string>("CHARGE_LLM_SERVICE") == "false" ? false : true

        if (input.context.userBalance?.amount.amount > 0 || !chargeLLMService) {
            const finalState = await input.context.compiledLangGraph.invoke({
                messages: [
                    ...(await input.context.chatMessageHistory.getMessages()),
                    new HumanMessage(input.context.prompt)
                ]
            })

            const aiMessage = finalState.messages[finalState.messages.length - 1] as AIMessage
            await input.context.chatMessageHistory.addMessages([new HumanMessage(input.context.prompt), aiMessage])

            response = aiMessage.content.toString()
        } else {
            const balance = `${input.context.userBalance.currency} 0.00`
            response = "You need to fund your account. Your balance is " + balance
        }

        // send message to user
        const message: MessengerRMQMessage = {
            contact: input.context.contact,
            type: "text",
            text: response,
            conversationType: "service"
        }

        this.whatsappRMQClient.emit(MessengerEventPattern, message)
    }

    updateBalance = async ({ input }: { input: { context: LPSContext } }) => {
        const usage = input.context.textLlmCallbackHandler.getUsage()
        const model = await this.llmModelService.getModel(input.context.textModelName)

        // calculate usage cost
        const chargeLLMService: boolean = this.configService.get<string>("CHARGE_LLM_SERVICE") == "false" ? false : true

        if (chargeLLMService) {
            const inputTokenCost = getTotalCost(usage.inputTokens, {
                amount: BigInt(model.costPerInputToken),
                multiplier: BigInt(model.costMultiplier)
            })
            const outputTokenCost = getTotalCost(usage.outputTokens, {
                amount: BigInt(model.costPerOutputToken),
                multiplier: BigInt(model.costMultiplier)
            })
            const totalCost = addMoney(inputTokenCost, outputTokenCost)

            if (totalCost.amount > 0) {
                const newBalance = await this.subscriptionService.updateUserBalance({
                    userId: input.context.contact.wa_id,
                    delta: {
                        amount: totalCost.amount.toString(),
                        multiplier: totalCost.multiplier.toString(),
                        currency: BASE_CURRENCY_ISO
                    }
                })

                this.logger.debug("Updated balance: ", { balance: newBalance })

                return newBalance
            } else {
                return {
                    amount: input.context.userBalance?.amount.amount,
                    multiplier: input.context.userBalance?.amount.multiplier,
                    currency: input.context.userBalance?.currency
                }
            }
        } else {
            return {
                amount: input.context.userBalance?.amount.amount,
                multiplier: input.context.userBalance?.amount.multiplier,
                currency: input.context.userBalance?.currency
            }
        }

    }

    private setUpStateMachine() {
        return setup({
            types: {
                context: {} as LPSContext,
                input: {} as LPSInput,
                children: {} as {
                    checkUserBalance: 'checkUserBalance';
                    initializeLLMTools: 'initializeLLMTools';
                    generateResponse: 'generateResponse';
                    updateBalance: 'updateBalance'
                }
            },
            actors: {
                checkUserBalance: fromPromise(this.checkUserBalance),
                initializeLLMTools: fromPromise(this.initializeLLMTools),
                generateResponse: fromPromise(this.generateResponse),
                updateBalance: fromPromise(this.updateBalance)
            }
        })
            .createMachine({
                /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgBsCBbAWgAcAnLAYzniRHK1gEsAXVrDfEAD0SkAjADYADOgCeiIQCYALADp5ATjUrZAZgDsY8QFZ525GhBEyVWvUUBhABZgaAawBCAQwJuMdXszaduXgEEYTkpRFk5E3RzCmo6WFhFAEkMDgAZdIBZABUsLAIGUD8OLh5GYOE9RVkADhU9WX1whFltEUV9aLMSOKtExQBxMAwwSjd2MAAlOGYMWDBfFlLAisEhIQkQaQRNeSETEyA */
                id: "llm-process",

                context: ({ input }) => ({
                    ...input
                }),
                initial: "CheckBalance",
                states: {
                    CheckBalance: {
                        invoke: {
                            id: "checkUserBalance",
                            src: "checkUserBalance",
                            input: ({ context }) => ({ userId: context.contact.wa_id }),
                            onDone: {
                                target: "InitializeLLMTools",
                                actions: assign({
                                    userBalance: ({ event }) => ({
                                        amount: {
                                            amount: event.output.amount,
                                            multiplier: event.output.multiplier
                                        },
                                        currency: event.output.currency
                                    })
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
                    InitializeLLMTools: {
                        invoke: {
                            id: "initializeLLMTools",
                            src: "initializeLLMTools",
                            input: ({ context }) => ({ userId: context.contact.wa_id }),
                            onDone: {
                                target: "GenerateResponse",
                                actions: assign({
                                    chatMessageHistory: ({ event }) => event.output.chatMessageHistory,
                                    textModelName: ({ event }) => event.output.textModelName,
                                    textLlmCallbackHandler: ({ event }) => event.output.handler,
                                    compiledLangGraph: ({ event }) => event.output.compliledGraph
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
                    GenerateResponse: {
                        invoke: {
                            id: "generateResponse",
                            src: "generateResponse",
                            input: ({ context }) => ({ context }),
                            onDone: {
                                target: "UpdateBalance"
                            },
                            onError: {
                                target: "Failure",
                                actions: assign({
                                    error: ({ event }) => event.error
                                })
                            }
                        }
                    },
                    UpdateBalance: {
                        invoke: {
                            id: "updateBalance",
                            src: "updateBalance",
                            input: ({ context }) => ({ context }),
                            onDone: {
                                target: "Complete",
                                actions: assign({
                                    userBalance: ({ event }) => ({
                                        amount: { amount: BigInt(event.output.amount), multiplier: BigInt(event.output.multiplier) },
                                        currency: event.output.currency
                                    })
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
                    Complete: {
                        tags: ["final", "success"]
                    },
                    Failure: {
                        tags: ["final", "failure"],
                        entry: ({ context }) => {
                            this.logger.error("LLM process failed.", { error: context.error, contact: context.contact })
                        }
                    }
                }
            })
    }
}

export type LPSContext = {
    contact: Contact;
    prompt: string;
    ragMode: boolean;
    ragFileId?: string;
    ragModeType?: "all" | "single";
    error?: any;
    userBalance?: {
        amount: Money,
        currency: string
    },
    chatMessageHistory?: ChatMessageHistory
    textModelName?: string
    textLlmCallbackHandler?: LLMCallbackHandler
    compiledLangGraph?: any
}

export type LPSInput = {
    contact: Contact;
    prompt: string;
    ragMode: boolean;
    ragFileId?: string;
    ragModeType?: "all" | "single"
}