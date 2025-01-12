import { assign, createActor, fromPromise, setup } from "xstate";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { Money, StateMachineActor } from "@app/medulla-common/common/extended-types";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { ConfigService } from "@nestjs/config";
import { SubscriptionService } from "../../subscription/subscription.service";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { BASE_CURRENCY_ISO } from "@app/medulla-common/common/constants";


@Injectable()
export class WebSearchStateMachineProvider {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly subscriptionService: SubscriptionService,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "websearch.state-machine.provider"
        })

        this.logger.info("initialize WebSearchStateMachineProvider")
    }

    getActor(input: WSMInput): StateMachineActor<any, WSMContext> {
        return createActor(this.setUpStateMachine(), { input }) as StateMachineActor<any, WSMContext>
    }

    checkUserBalance = async ({ input }: { input: { userId: string } }) => {
        const { amount, multiplier, currency } = await this.subscriptionService.checkUserBalance(input)
        this.logger.debug("Checked user balance.", { amount: BigInt(amount), multiplier: BigInt(multiplier), currency })
        return { amount: BigInt(amount), multiplier: BigInt(multiplier), currency }
    }

    generateResponse = async ({ input }: { input: { context: WSMContext } }) => {
        const context = input.context
        let response: string
        let success: boolean

        const chargeWebSearchService: boolean = this.configService.get<string>("CHARGE_WEBSEARCH_SERVICE") == "false" ? false : true

        if (input.context.userBalance?.amount.amount > 0 || !chargeWebSearchService) {
            const searchTool = new TavilySearchResults({
                maxResults: Number(this.configService.get<string>("WEBSEARCH_MAX_RESULTS")) || 2,
                apiKey: this.configService.get<string>("TAVILY_API_KEY")
            })

            try {
                const result = await searchTool.invoke(input.context.searchQuery)

                const json_result: {
                    title: string;
                    url: string;
                    content: string;
                    score: number,
                    raw_content: any
                }[] = JSON.parse(result)

                if (json_result.length > 0) {
                    success = true

                    json_result.forEach((search, index) => {
                        response = "Here are the web search results:\n\n"
                        response += `${index + 1}: ${search.title}\n`
                        response += `Link: ${search.url}\n`
                        response += search.content + "\n\n"
                    })

                } else {
                    response = "Could not get web search results."
                    success = false
                }

            } catch (error) {
                response = "An error occured while trying to fetch search results."
                this.logger.error("Tavily search failed.", {error})
            }
            
        } else {
            response = "The user's account does not have enough credit to use the web search tool. Ask if user would like to fund their account."
        }

        return { response, success }
    }

    updateBalance = async ({ input }: { input: { context: WSMContext } }) => {
        // calculate usage cost
        const chargeWebSearchService: boolean = this.configService.get<string>("CHARGE_WEBSEARCH_SERVICE") == "false" ? false : true

        if (chargeWebSearchService && input.context.success) {

            const costPerWebSearchApiCall = BigInt(this.configService.get<string>("WEBSEARCH_API_CALL_COST"))
            const costPerWebSearchApiCallMultiplier = BigInt(this.configService.get<string>("WEBSEARCH_API_CALL_COST_MULTIPLIER"))

            const outputTokenCost = {
                    amount: costPerWebSearchApiCall,
                    multiplier: BigInt(costPerWebSearchApiCallMultiplier)
            }

            if (outputTokenCost.amount > 0) {
                const newBalance = await this.subscriptionService.updateUserBalance({
                    userId: input.context.userId,
                    delta: {
                        amount: outputTokenCost.amount.toString(),
                        multiplier: outputTokenCost.multiplier.toString(),
                        currency: BASE_CURRENCY_ISO
                    },
                    sign: -1
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
                context: {} as WSMContext,
                input: {} as WSMInput,
                children: {} as {
                    checkUserBalance: 'checkUserBalance';
                    generateResponse: 'generateResponse';
                    updateBalance: 'updateBalance'
                }
            },
            actors: {
                checkUserBalance: fromPromise(this.checkUserBalance),
                generateResponse: fromPromise(this.generateResponse),
                updateBalance: fromPromise(this.updateBalance)
            }
        })
            .createMachine({
                /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgBsCBbAWgAcAnLAYzniRHK1gEsAXVrDfEAD0SkAjADYADOgCeiIQCYALADp5ATjUrZAZgDsY8QFZ525GhBEyVWvUUBhABZgaAawBCAQwJuMdXszaduXgEEYTkpRFk5E3RzCmo6WFhFAEkMDgAZdIBZABUsLAIGUD8OLh5GYOE9RVkADhU9WX1whFltEUV9aLMSOKtExQBxMAwwSjd2MAAlOGYMWDBfFlLAisEhIQkQaQRNeSETEyA */
                id: "image-gen-process",

                context: ({ input }) => ({
                    ...input
                }),
                initial: "CheckBalance",
                states: {
                    CheckBalance: {
                        invoke: {
                            id: "checkUserBalance",
                            src: "checkUserBalance",
                            input: ({ context }) => ({ userId: context.userId }),
                            onDone: {
                                target: "GenerateResponse",
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
                    GenerateResponse: {
                        invoke: {
                            id: "generateResponse",
                            src: "generateResponse",
                            input: ({ context }) => ({ context }),
                            onDone: {
                                target: "UpdateBalance",
                                actions: assign({
                                    response: ({ event }) => event.output.response,
                                    success: ({ event }) => event.output.success
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
                            this.logger.error("LLM process failed.", { error: context.error, userId: context.userId })
                        }
                    }
                }
            })
    }
}

export type WSMContext = {
    userId: string;
    searchQuery: string;
    error?: any;
    userBalance?: {
        amount: Money,
        currency: string
    },
    response?: string;
    success?: boolean;
}

export type WSMInput = {
    userId: string;
    searchQuery: string;
}